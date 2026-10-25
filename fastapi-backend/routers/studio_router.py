import requests
from fastapi.responses import RedirectResponse
import base64
import time
import os
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, Body, HTTPException, Request
from pydantic import BaseModel, Field

from config import CONFIG
from growthcrew.frontend_urls import dashboard_url
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
            safe_ch = {**ch, "postsCount": p_count, "connected": True}
            if safe_ch.get("fbAccessToken"):
                safe_ch["fbAccessToken"] = "***"
            mapped.append(safe_ch)
        return mapped
    except Exception as e:
        print(f"Error fetching channels: {e}")
        return [
            {**c, "fbAccessToken": "***" if c.get("fbAccessToken") else None}
            for c in QueueService.get_channels()
        ]

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

        # Resolve channel-specific credentials for multi-client isolation
        channel = QueueService.get_channel_by_id(data.get("integrationId"))
        if not channel and channels:
            channel = channels[0]
        channel = channel or {}

        ch_fb_page_id = channel.get("fbPageId")
        ch_fb_token = channel.get("fbAccessToken")
        ch_ig_id = channel.get("igBusinessAccountId")
        ch_discord_url = channel.get("discordWebhookUrl")

        broadcast_result = MultiPlatformPublisher.broadcast_to_all(
            platforms=target_platforms,
            text=clean_text,
            media_url=media_url,
            fb_page_id=ch_fb_page_id,
            fb_access_token=ch_fb_token,
            ig_business_account_id=ch_ig_id,
            discord_webhook_url=ch_discord_url
        )
        final_post_id = None
        if "facebook" in broadcast_result.get("platforms", {}):
            final_post_id = broadcast_result["platforms"]["facebook"].get("id")
        saved = QueueService.update_post(saved["id"], {
            "postizPostId": final_post_id,
            "publishedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "broadcastResult": broadcast_result
        })

        if not broadcast_result.get("success", False):
            saved = QueueService.update_post(saved["id"], {
                "status": "FAILED",
                "broadcastResult": broadcast_result
            })
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

    # Resolve channel-specific credentials for multi-client isolation
    channel = QueueService.get_channel_by_id(post.get("integrationId"))
    if not channel:
        channels = QueueService.get_channels()
        channel = channels[0] if channels else {}
    channel = channel or {}

    ch_fb_page_id = channel.get("fbPageId")
    ch_fb_token = channel.get("fbAccessToken")
    ch_ig_id = channel.get("igBusinessAccountId")
    ch_discord_url = channel.get("discordWebhookUrl")

    # Multi-platform simultaneous broadcasting using channel's dedicated credentials
    broadcast_result = MultiPlatformPublisher.broadcast_to_all(
        platforms=target_platforms,
        text=clean_text,
        media_url=media_url,
        fb_page_id=ch_fb_page_id,
        fb_access_token=ch_fb_token,
        ig_business_account_id=ch_ig_id,
        discord_webhook_url=ch_discord_url
    )

    final_post_id = None
    if "facebook" in broadcast_result.get("platforms", {}):
        final_post_id = broadcast_result["platforms"]["facebook"].get("id")

    if not broadcast_result.get("success", False):
        updated = QueueService.update_post(post_id, {
            "status": "FAILED",
            "broadcastResult": broadcast_result
        })
        raise HTTPException(
            status_code=400,
            detail=broadcast_result.get("summary") or "Failed to publish to selected channels"
        )

    updated = QueueService.update_post(post_id, {
        "status": "PUBLISHED",
        "postizPostId": final_post_id,
        "publishedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "reviewedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "broadcastResult": broadcast_result
    })

    return {
        "success": True,
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

@router.delete("/channels/{channel_id}")
async def delete_channel_endpoint(channel_id: str):
    success = QueueService.delete_channel(channel_id)
    if not success:
        raise HTTPException(status_code=404, detail="Channel not found")
    return {"success": True, "channels": QueueService.get_channels()}

@router.post("/channels/custom-connect")
async def custom_connect_channel(req: CustomChannelConnectRequest):
    clean_page_id = req.fbPageId.strip() if req.fbPageId else None
    clean_token = req.fbAccessToken.strip() if req.fbAccessToken else None
    clean_discord = req.discordWebhookUrl.strip() if req.discordWebhookUrl else None
    ig_id = None

    if req.platform in ("facebook", "instagram"):
        if not clean_page_id or not clean_token:
            raise HTTPException(
                status_code=400,
                detail="Meta Page ID and Page Access Token are required for manual setup. For 1-Click setup without tokens, click '1-Click Connect with Facebook & Instagram' above."
            )
        try:
            lookup = requests.get(
                f"https://graph.facebook.com/v21.0/{clean_page_id}?fields=instagram_business_account{{id,username,name,profile_picture_url}},name&access_token={clean_token}",
                timeout=10
            ).json()
            if "error" in lookup:
                err_msg = lookup["error"].get("message", "Invalid Meta Page ID or Token")
                raise HTTPException(status_code=400, detail=f"Meta Error: {err_msg}")

            ig_data = lookup.get("instagram_business_account") or {}
            if req.platform == "instagram" and not ig_data.get("id"):
                page_name = lookup.get("name", clean_page_id)
                raise HTTPException(
                    status_code=400,
                    detail=f"The Facebook Page '{page_name}' does not have a linked Instagram Business account. Please link your Instagram account to this Page in Facebook Page Settings first."
                )
            ig_id = ig_data.get("id")
            ig_username = ig_data.get("username")
            if ig_username:
                req.handle = f"@{ig_username}"
                req.name = f"{lookup.get('name', 'Page')} (@{ig_username})"
            elif lookup.get("name"):
                req.name = lookup["name"]
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to verify Meta credentials: {str(e)}")

    channel_obj = {
        "id": f"chan_{int(time.time() * 1000)}",
        "name": req.name or f"Connected ({req.platform.title()})",
        "handle": req.handle or f"@{req.platform.lower()}",
        "platform": req.platform.lower(),
        "platforms": ["instagram", "facebook"] if req.platform in ("instagram", "facebook") else [req.platform.lower()],
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
        "connected": True,
        "provider": "Custom Auth",
        "fbPageId": clean_page_id,
        "fbAccessToken": clean_token,
        "igBusinessAccountId": ig_id,
        "discordWebhookUrl": clean_discord
    }
    updated = QueueService.add_channel(channel_obj)

    safe_channel = {**channel_obj, "fbAccessToken": "***" if clean_token else None}
    safe_channels = [
        {**c, "fbAccessToken": "***" if c.get("fbAccessToken") else None}
        for c in updated
    ]
    return {"success": True, "channel": safe_channel, "channels": safe_channels}

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


# --- META / FACEBOOK & INSTAGRAM 1-CLICK OAUTH 2.0 FLOW ---

@router.get("/auth/meta/url")
async def get_meta_oauth_url():
    redirect_uri = f"{CONFIG.BACKEND_PUBLIC_URL.rstrip('/')}/api/auth/meta/callback"
    scopes = [
        "pages_show_list",
        "pages_read_engagement",
        "pages_manage_posts",
        "instagram_basic",
        "instagram_content_publish",
        "business_management",
        "public_profile"
    ]
    scope_str = ",".join(scopes)
    encoded_redirect = requests.utils.quote(redirect_uri, safe="")
    encoded_scope = requests.utils.quote(scope_str, safe="")
    url = (
        f"https://www.facebook.com/v21.0/dialog/oauth?"
        f"client_id={CONFIG.META_APP_ID}&"
        f"redirect_uri={encoded_redirect}&"
        f"scope={encoded_scope}&"
        f"response_type=code"
    )
    return {"url": url, "redirectUri": redirect_uri, "appId": CONFIG.META_APP_ID}

@router.get("/auth/meta/login")
async def meta_oauth_redirect():
    data = await get_meta_oauth_url()
    return RedirectResponse(url=data["url"])

@router.get("/auth/meta/callback")
async def meta_oauth_callback(
    code: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None
):
    frontend_base = dashboard_url('/social')
    if error or not code:
        err_msg = error_description or error or "Authorization canceled by user"
        return RedirectResponse(url=f"{frontend_base}?oauth_error={requests.utils.quote(err_msg)}")

    redirect_uri = f"{CONFIG.BACKEND_PUBLIC_URL.rstrip('/')}/api/auth/meta/callback"

    try:
        # Step 1: Exchange code for short-lived access token
        token_url = (
            f"https://graph.facebook.com/v21.0/oauth/access_token?"
            f"client_id={CONFIG.META_APP_ID}&"
            f"client_secret={CONFIG.META_APP_SECRET}&"
            f"redirect_uri={requests.utils.quote(redirect_uri, safe='')}&"
            f"code={code}"
        )
        token_res = requests.get(token_url, timeout=15).json()
        short_token = token_res.get("access_token")
        if not short_token:
            err = token_res.get("error", {}).get("message", "Could not exchange authorization code")
            return RedirectResponse(url=f"{frontend_base}?oauth_error={requests.utils.quote(err)}")

        # Step 2: Exchange short-lived token for long-lived 60-day user token
        long_url = (
            f"https://graph.facebook.com/v21.0/oauth/access_token?"
            f"grant_type=fb_exchange_token&"
            f"client_id={CONFIG.META_APP_ID}&"
            f"client_secret={CONFIG.META_APP_SECRET}&"
            f"fb_exchange_token={short_token}"
        )
        long_res = requests.get(long_url, timeout=15).json()
        user_token = long_res.get("access_token") or short_token

        # Step 3: Fetch user's managed Facebook Pages and linked Instagram accounts
        accounts_url = (
            f"https://graph.facebook.com/v21.0/me/accounts?"
            f"fields=id,name,access_token,instagram_business_account{{id,username,profile_picture_url}}&"
            f"access_token={user_token}"
        )
        acc_res = requests.get(accounts_url, timeout=15).json()
        pages = acc_res.get("data", [])

        if not pages:
            return RedirectResponse(url=f"{frontend_base}?oauth_error={requests.utils.quote('No Facebook Pages found. Please ensure you manage at least one Facebook Page.')}")

        connected_count = 0
        first_chan_name = ""

        for p in pages:
            p_id = p.get("id")
            p_name = p.get("name")
            p_token = p.get("access_token") # Long-lived Page token!
            ig_data = p.get("instagram_business_account") or {}
            ig_id = ig_data.get("id")
            ig_username = ig_data.get("username")
            avatar = ig_data.get("profile_picture_url") or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"

            chan_id = f"chan_meta_{p_id}"
            chan_name = f"{p_name} (@{ig_username})" if ig_username else p_name
            chan_handle = f"@{ig_username}" if ig_username else f"@{p_name.lower().replace(' ', '')}"

            channel_obj = {
                "id": chan_id,
                "name": chan_name,
                "handle": chan_handle,
                "platform": "instagram" if ig_id else "facebook",
                "platforms": ["instagram", "facebook"] if ig_id else ["facebook"],
                "avatar": avatar,
                "connected": True,
                "provider": "Meta 1-Click OAuth",
                "fbPageId": p_id,
                "fbAccessToken": p_token,
                "igBusinessAccountId": ig_id,
                "discordWebhookUrl": None
            }
            QueueService.add_channel(channel_obj)
            connected_count += 1
            if not first_chan_name:
                first_chan_name = chan_name

        return RedirectResponse(url=f"{frontend_base}?oauth_success=true&connected_count={connected_count}&channel_name={requests.utils.quote(first_chan_name)}")
    except Exception as e:
        return RedirectResponse(url=f"{frontend_base}?oauth_error={requests.utils.quote(str(e))}")
