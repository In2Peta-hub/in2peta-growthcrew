import base64
import time
import os
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, Body, HTTPException, Request
from pydantic import BaseModel, Field

from config import CONFIG
from services.gemini_service import GeminiService
from services.ai_caption_service import AICaptionService
from services.s3_service import S3Service
from services.postiz_service import PostizService
from services.queue_service import QueueService
from services.facebook_service import FacebookService
from services.multi_platform_service import MultiPlatformPublisher

router = APIRouter(prefix="/api", tags=["Growthcrew Studio"])

class GeneratePostRequest(BaseModel):
    topic: str
    tone: Optional[str] = "Friendly"
    format: Optional[str] = "feed" # 'feed' | 'reel'
    callToAction: Optional[str] = ""
    customInstructions: Optional[str] = ""
    scheduledDate: Optional[str] = None
    integrationId: Optional[str] = None
    mediaUrl: Optional[str] = None
    mediaId: Optional[str] = None
    postizMediaId: Optional[str] = None
    mediaType: Optional[str] = "image"
    autoApproveOverride: Optional[bool] = None
    platforms: Optional[List[str]] = None
    platform: Optional[str] = "instagram"
    status: Optional[str] = None

class UploadBase64Request(BaseModel):
    base64: str
    filename: Optional[str] = None
    mimeType: Optional[str] = "image/jpeg"

class CreateQueuePostRequest(BaseModel):
    id: Optional[str] = None
    topic: Optional[str] = "Untitled Post"
    hook: Optional[str] = ""
    caption: Optional[str] = ""
    content: Optional[str] = ""
    hashtags: Optional[List[str]] = Field(default_factory=list)
    callToAction: Optional[str] = ""
    format: Optional[str] = "feed"
    visualPrompt: Optional[str] = ""
    visualKeyword: Optional[str] = ""
    visualUrl: Optional[str] = None
    mediaUrl: Optional[str] = None
    mediaType: Optional[str] = "image"
    reelStoryboard: Optional[Any] = None
    fullPostText: Optional[str] = None
    integrationId: Optional[str] = None
    channelName: Optional[str] = None
    platform: Optional[str] = "instagram"
    platforms: Optional[List[str]] = Field(default_factory=lambda: ["instagram", "facebook"])
    scheduledDate: Optional[str] = None
    status: Optional[str] = "PENDING_REVIEW"

class UpdatePostRequest(BaseModel):
    hook: Optional[str] = None
    caption: Optional[str] = None
    content: Optional[str] = None
    hashtags: Optional[List[str]] = None
    callToAction: Optional[str] = None
    scheduledDate: Optional[str] = None
    status: Optional[str] = None
    reviewNotes: Optional[str] = None
    mediaUrl: Optional[str] = None
    visualUrl: Optional[str] = None
    platform: Optional[str] = None
    platforms: Optional[List[str]] = None

@router.get("/health")
async def get_health():
    channels = QueueService.get_channels()
    active_channel = channels[0] if channels else None
    settings = QueueService.get_settings()
    s3_status = S3Service.check_status()

    return {
        "status": "healthy",
        "textEngine": "Growthcrew Smart AI Engine",
        "mediaEngine": "Growthcrew Media Platform (Images & Videos)",
        "publishingEngine": "Connected" if active_channel else "Standby",
        "activeAccount": f"{active_channel.get('name')} ({active_channel.get('handle')})" if active_channel else "No account linked",
        "autoApprove": settings.get("autoApprove", False),
        "s3Storage": s3_status,
        "backend": "FastAPI (Python)"
    }

@router.get("/settings")
async def get_settings():
    return QueueService.get_settings()

@router.post("/settings")
async def update_settings(payload: Dict[str, Any] = Body(...)):
    return QueueService.update_settings(payload)

@router.get("/channels")
async def get_channels():
    try:
        integrations = []
        if not PostizService.is_offline():
            integrations = PostizService.get_integrations()

        queue = QueueService.get_queue()

        if integrations:
            mapped = []
            for ch in integrations:
                ch_id = ch.get("id")
                identifier = ch.get("identifier", "instagram")
                posts_count = len([
                    p for p in queue
                    if p.get("integrationId") == ch_id or (p.get("platforms") and identifier in p.get("platforms"))
                ])
                name = ch.get("name", "Account")
                mapped.append({
                    "id": ch_id,
                    "name": name,
                    "handle": f"@{name.lower()}",
                    "platform": identifier,
                    "postsCount": posts_count,
                    "avatar": ch.get("picture") or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
                    "connected": not ch.get("disabled", False),
                    "provider": "Meta Graph API"
                })
            QueueService.save_channels(mapped)
            return mapped

        persisted = QueueService.get_channels()
        mapped = []
        for ch in persisted:
            p_count = len([
                p for p in queue
                if p.get("integrationId") == ch.get("id") or (p.get("platforms") and ch.get("platform") in p.get("platforms"))
            ])
            mapped.append({**ch, "postsCount": p_count, "connected": True})
        return mapped
    except Exception as e:
        print(f"Error fetching channels: {e}")
        return QueueService.get_channels()

@router.post("/channels")
async def add_channel(channel: Dict[str, Any] = Body(...)):
    try:
        updated = QueueService.add_channel(channel)
        return {"success": True, "channels": updated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_media(
    request: Request,
    media: Optional[UploadFile] = File(None)
):
    file_bytes = None
    original_filename = "media.jpg"
    mime_type = "image/jpeg"

    # Check if JSON payload with base64 was sent
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            body = await request.json()
            raw_base64 = body.get("base64", "")
            if raw_base64:
                if "," in raw_base64:
                    header, data = raw_base64.split(",", 1)
                    if "data:" in header and ";base64" in header:
                        mime_type = header.split("data:")[1].split(";base64")[0]
                    file_bytes = base64.b64decode(data)
                else:
                    file_bytes = base64.b64decode(raw_base64)
                    mime_type = body.get("mimeType", "image/jpeg")

                ext = ".png" if "png" in mime_type else ".mp4" if "mp4" in mime_type else ".jpg"
                original_filename = body.get("filename") or f"in2peta_mobile_{int(time.time() * 1000)}{ext}"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse base64: {e}")

    elif media:
        file_bytes = await media.read()
        original_filename = media.filename or "media.jpg"
        mime_type = media.content_type or "image/jpeg"

    if not file_bytes:
        raise HTTPException(status_code=400, detail="No media file or base64 data provided.")

    is_video = mime_type.startswith("video/")

    # 1. Primary Cloud Storage: Upload directly to AWS S3 bucket
    s3_url = S3Service.upload_media(file_bytes, original_filename, mime_type)
    public_url = s3_url or f"https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1080&auto=format&fit=crop&q=80"

    return {
        "url": public_url,
        "s3Url": s3_url,
        "storageEngine": "AWS S3" if s3_url else "Direct Stream",
        "filename": original_filename,
        "mimetype": mime_type,
        "size": len(file_bytes),
        "mediaType": "video" if is_video else "image"
    }

@router.post("/generate")
async def generate_post(req: GeneratePostRequest):
    if not req.topic:
        raise HTTPException(status_code=400, detail="Please enter a topic or concept for the post.")

    # 1. Generate text caption, hook, and hashtags using In2Peta DeepSeek-Flash (with Gemini fallback)
    generated = AICaptionService.generate_post(
        topic=req.topic,
        tone=req.tone or "Warm & Engaging",
        format_type=req.format or "feed",
        call_to_action=req.callToAction or "",
        custom_instructions=req.customInstructions or "",
        platforms=req.platforms or ["facebook", "instagram", "linkedin", "x", "reddit", "youtube", "discord"]
    )

    # 2. Channels & Settings
    channels = QueueService.get_channels()
    final_integration_id = req.integrationId or (channels[0].get("id") if channels else None)
    settings = QueueService.get_settings()

    is_draft = req.status in ("DRAFT", "IDEA")
    is_paused = bool(settings.get("isQueuePaused", False))
    should_auto_approve = (
        not is_draft and not is_paused and (req.autoApproveOverride if req.autoApproveOverride is not None else bool(settings.get("autoApprove", False)))
    )

    status = req.status if is_draft else "PENDING_REVIEW"
    schedule_time = (
        req.scheduledDate if is_draft
        else (req.scheduledDate or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() + (settings.get("defaultScheduleDelayHours", 2) * 3600))))
    )

    full_post_text = "\n\n".join(filter(None, [
        generated.get("hook"),
        generated.get("caption"),
        req.callToAction if req.callToAction and req.callToAction not in generated.get("caption", "") else None,
        " ".join(generated.get("hashtags", []))
    ]))

    chosen_media_url = req.mediaUrl or "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1080&auto=format&fit=crop&q=80"
    postiz_result = None

    # 3. Auto-publish if Auto-Approval is ON
    if should_auto_approve and final_integration_id:
        try:
            postiz_result = PostizService.create_post(
                integration_id=final_integration_id,
                content=full_post_text,
                scheduled_date=schedule_time,
                post_type="schedule",
                media_url=chosen_media_url,
                media_type=req.mediaType or "image"
            )
            status = "SCHEDULED"
        except Exception as err:
            print(f"Auto-scheduling error, falling back to review queue: {err}")
            status = "PENDING_REVIEW"

    # 4. Save to queue
    saved_post = QueueService.add_to_queue({
        "topic": req.topic,
        "hook": generated.get("hook", ""),
        "caption": generated.get("caption", ""),
        "hashtags": generated.get("hashtags", []),
        "callToAction": req.callToAction or "",
        "format": req.format or "feed",
        "visualPrompt": generated.get("visualPrompt", ""),
        "visualKeyword": generated.get("visualKeyword", ""),
        "visualUrl": chosen_media_url,
        "mediaType": req.mediaType or "image",
        "reelStoryboard": generated.get("reelStoryboard"),
        "fullPostText": full_post_text,
        "integrationId": final_integration_id,
        "platform": req.platform or "instagram",
        "platforms": req.platforms or [req.platform or "instagram"],
        "scheduledDate": schedule_time,
        "status": status,
        "postizPostId": postiz_result.get("postId") if isinstance(postiz_result, dict) else None
    })

    return {
        "success": True,
        "autoApproved": status == "SCHEDULED",
        "post": saved_post,
        "generated": {
            **generated,
            "mediaUrl": saved_post.get("visualUrl"),
            "mediaType": req.mediaType or "image"
        }
    }

@router.get("/queue")
async def get_queue():
    queue = QueueService.get_queue()
    counts = {
        "total": len(queue),
        "pending": len([p for p in queue if p.get("status") == "PENDING_REVIEW"]),
        "scheduled": len([p for p in queue if p.get("status") in ("SCHEDULED", "APPROVED")]),
        "published": len([p for p in queue if p.get("status") == "PUBLISHED"]),
        "rejected": len([p for p in queue if p.get("status") == "REJECTED"])
    }
    return {"counts": counts, "queue": queue}

@router.get("/published")
async def get_published():
    queue = QueueService.get_queue()
    published = [p for p in queue if p.get("status") == "PUBLISHED"]
    return published

def extract_postiz_id(res):
    if isinstance(res, list) and len(res) > 0:
        return res[0].get("postId")
    elif isinstance(res, dict):
        return res.get("postId") or res.get("id")
    return None

@router.post("/queue")
async def create_queue_post(post: CreateQueuePostRequest):
    data = post.model_dump()
    if data.get("mediaUrl") and not data.get("visualUrl"):
        data["visualUrl"] = data["mediaUrl"]

    if not data.get("scheduledDate"):
        data["scheduledDate"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() + 7200))

    channels = QueueService.get_channels()
    if not data.get("integrationId") and channels:
        data["integrationId"] = channels[0].get("id")

    saved = QueueService.add_to_queue(data)

    if data.get("status") == "PUBLISHED":
        target_platforms = data.get("platforms") or ["facebook", "instagram", "linkedin", "x", "reddit", "youtube", "discord"]
        clean_text = data.get("fullPostText") or data.get("caption") or ""
        media_url = data.get("visualUrl") or data.get("mediaUrl")
        broadcast_result = MultiPlatformPublisher.broadcast_to_all(
            platforms=target_platforms,
            text=clean_text,
            media_url=media_url
        )
        final_post_id = None
        if "facebook" in broadcast_result.get("platforms", {}):
            final_post_id = broadcast_result["platforms"]["facebook"].get("id")
        saved = QueueService.update_post(saved["id"], {
            "postizPostId": final_post_id,
            "publishedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "broadcastResult": broadcast_result
        })

        if not broadcast_result.get("success", False) and broadcast_result.get("failedCount", 0) > 0 and broadcast_result.get("successfulCount", 0) == 0:
            saved = QueueService.update_post(saved["id"], {"status": "FAILED"})
            raise HTTPException(
                status_code=400,
                detail=broadcast_result.get("summary") or "Failed to publish to selected channels"
            )

        return {"success": True, "post": saved, "broadcastResult": broadcast_result}

    return {"success": True, "post": saved}

@router.post("/publish")
async def direct_publish(post: CreateQueuePostRequest):
    data = post.model_dump()
    data["status"] = "PUBLISHED"
    return await create_queue_post(CreateQueuePostRequest(**data))

@router.put("/queue/{post_id}")
async def update_post(post_id: str, updates: UpdatePostRequest):
    payload = {k: v for k, v in updates.model_dump().items() if v is not None}
    updated = QueueService.update_post(post_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Post not found")
    return updated

@router.post("/queue/{post_id}/approve")
async def approve_post(post_id: str):
    post = QueueService.get_post_by_id(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    postiz_result = None
    if post.get("integrationId"):
        try:
            postiz_result = PostizService.create_post(
                integration_id=post["integrationId"],
                content=post.get("fullPostText", ""),
                scheduled_date=post.get("scheduledDate"),
                post_type="schedule",
                media_url=post.get("visualUrl"),
                media_type=post.get("mediaType", "image")
            )
        except Exception as e:
            print(f"Publish notice: {e}")

    updated = QueueService.update_post(post_id, {
        "status": "SCHEDULED",
        "postizPostId": extract_postiz_id(postiz_result),
        "reviewedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    })

    return {
        "success": True,
        "message": "Post approved and scheduled with media for Instagram & Facebook!",
        "post": updated
    }

@router.post("/queue/{post_id}/publish-now")
async def publish_now(post_id: str):
    post = QueueService.get_post_by_id(post_id)
    if not post:
        queue = QueueService.get_queue()
        if queue:
            post = queue[0]
            post_id = post["id"]
        else:
            raise HTTPException(status_code=404, detail="No post found to publish")

    clean_text = post.get("fullPostText", "") or post.get("caption", "")
    media_url = post.get("visualUrl") or post.get("mediaUrl")
    target_platforms = post.get("platforms") or ["facebook", "instagram", "linkedin", "x", "reddit", "youtube", "discord"]

    # Multi-platform simultaneous broadcasting: same post to all selected channels!
    broadcast_result = MultiPlatformPublisher.broadcast_to_all(
        platforms=target_platforms,
        text=clean_text,
        media_url=media_url
    )

    final_post_id = None
    if "facebook" in broadcast_result.get("platforms", {}):
        final_post_id = broadcast_result["platforms"]["facebook"].get("id")

    updated = QueueService.update_post(post_id, {
        "status": "PUBLISHED",
        "postizPostId": final_post_id,
        "publishedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "reviewedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "broadcastResult": broadcast_result
    })

    return {
        "success": broadcast_result.get("success", True),
        "message": broadcast_result.get("summary", "Post published across all channels!"),
        "post": updated,
        "postizPostId": final_post_id,
        "directFacebook": "facebook" in broadcast_result.get("platforms", {}),
        "broadcastResult": broadcast_result
    }

class CustomChannelConnectRequest(BaseModel):
    platform: str
    handle: Optional[str] = None
    name: Optional[str] = None
    fbPageId: Optional[str] = None
    fbAccessToken: Optional[str] = None
    discordWebhookUrl: Optional[str] = None

@router.post("/channels/custom-connect")
async def custom_connect_channel(req: CustomChannelConnectRequest):
    if req.platform in ("facebook", "instagram") and req.fbPageId and req.fbAccessToken:
        clean_page_id = req.fbPageId.strip()
        clean_token = req.fbAccessToken.strip()
        CONFIG.FB_PAGE_ID = clean_page_id
        CONFIG.FB_PAGE_ACCESS_TOKEN = clean_token

        # Automatically look up linked Instagram Business Account ID from Facebook Page
        try:
            lookup = requests.get(
                f"https://graph.facebook.com/v21.0/{clean_page_id}?fields=instagram_business_account,name&access_token={clean_token}",
                timeout=10
            ).json()
            if "instagram_business_account" in lookup and "id" in lookup["instagram_business_account"]:
                CONFIG.IG_BUSINESS_ACCOUNT_ID = lookup["instagram_business_account"]["id"]
                print(f"[Custom Connect] Auto-detected Instagram Business ID: {CONFIG.IG_BUSINESS_ACCOUNT_ID}")
        except Exception as e:
            print(f"[Custom Connect] Instagram lookup notice: {e}")

    if req.platform == "discord" and req.discordWebhookUrl:
        CONFIG.DISCORD_WEBHOOK_URL = req.discordWebhookUrl.strip()

    channel_obj = {
        "id": f"chan_{int(time.time() * 1000)}",
        "name": req.name or f"Connected ({req.platform.title()})",
        "handle": req.handle or f"@{req.platform.lower()}",
        "platform": req.platform.lower(),
        "platforms": ["instagram", "facebook"] if req.platform in ("instagram", "facebook") else [req.platform.lower()],
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
        "connected": True,
        "provider": "Custom Auth"
    }
    updated = QueueService.add_channel(channel_obj)
    return {"success": True, "channel": channel_obj, "channels": updated}

@router.get("/facebook/status")
async def get_facebook_status():
    if not CONFIG.FB_PAGE_ACCESS_TOKEN:
        return {"configured": False, "pageId": CONFIG.FB_PAGE_ID, "message": "FB_PAGE_ACCESS_TOKEN not set"}
    return FacebookService.verify_token(CONFIG.FB_PAGE_ID, CONFIG.FB_PAGE_ACCESS_TOKEN)

@router.delete("/queue/{post_id}")
async def delete_post(post_id: str):
    success = QueueService.delete_post(post_id)
    if not success:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"success": True}
