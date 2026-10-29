import os
import requests
import time
from typing import Dict, Any, List, Optional
from config import CONFIG
from services.facebook_service import FacebookService

class MultiPlatformPublisher:
    SUPPORTED_PLATFORMS = [
        "facebook",
        "instagram",
        "linkedin",
        "x",
        "reddit",
        "youtube",
        "discord"
    ]

    PLATFORM_LABELS = {
        "facebook": "Facebook Page",
        "instagram": "Instagram",
        "linkedin": "LinkedIn",
        "x": "X (Twitter)",
        "reddit": "Reddit",
        "youtube": "YouTube Community",
        "discord": "Discord Channel"
    }

    @classmethod
    def publish_discord_webhook(
        cls,
        webhook_url: str,
        message: str,
        image_url: Optional[str] = None,
        title: Optional[str] = None
    ) -> Dict[str, Any]:
        """Direct Discord Webhook broadcast with rich embed."""
        clean_url = (webhook_url or "").strip()
        if not clean_url:
            return {"status": "skipped", "message": "No Discord Webhook configured"}

        embed: Dict[str, Any] = {
            "title": (title or "GrowthCrew Social Studio Broadcast")[:256],
            "description": message[:4096],
            "color": 0x5865F2,  # Discord blurple
            "footer": {"text": "Published via GrowthCrew Social Studio"},
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        if image_url:
            embed["image"] = {"url": image_url}

        payload: Dict[str, Any] = {
            "content": "🚀 **New Broadcast from GrowthCrew Social Studio**",
            "embeds": [embed]
        }

        # Request ?wait=true so Discord returns the published message object
        post_target = clean_url if "?wait=true" in clean_url else f"{clean_url.split('?')[0]}?wait=true"
        res = requests.post(post_target, json=payload, timeout=15)
        if res.status_code in (200, 204):
            msg_id = None
            msg_url = None
            if res.content:
                try:
                    d = res.json()
                    msg_id = d.get("id")
                    channel_id = d.get("channel_id")
                    guild_id = d.get("guild_id")
                    if channel_id and msg_id:
                        msg_url = f"https://discord.com/channels/{guild_id or '@me'}/{channel_id}/{msg_id}"
                except Exception:
                    pass
            return {
                "status": "success",
                "platform": "Discord Channel",
                "id": msg_id or f"dc_{int(time.time() * 1000)}",
                "url": msg_url or clean_url,
                "message": f"Broadcasted live to Discord Channel" + (f": {msg_url}" if msg_url else "")
            }

        err_detail = res.text
        try:
            err_json = res.json()
            err_detail = err_json.get("message") or err_detail
        except Exception:
            pass
        raise Exception(f"Discord Webhook error (HTTP {res.status_code}): {err_detail}")

    @classmethod
    def get_reddit_access_token(
        cls,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        refresh_token: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> str:
        """Exchange Reddit app credentials or refresh token for a Bearer access token."""
        cid = (client_id or CONFIG.REDDIT_CLIENT_ID).strip()
        cs = (client_secret or CONFIG.REDDIT_CLIENT_SECRET).strip()
        u = (username or CONFIG.REDDIT_USERNAME).strip()
        p = (password or CONFIG.REDDIT_PASSWORD).strip()
        rt = (refresh_token or CONFIG.REDDIT_REFRESH_TOKEN).strip()
        ua = (user_agent or CONFIG.REDDIT_USER_AGENT or f"GrowthCrew:v1.0 (by /u/{u or 'user'})").strip()

        if not cid or not cs:
            raise Exception("Reddit Client ID and Client Secret are required. Please configure them in Settings or .env")

        auth = requests.auth.HTTPBasicAuth(cid, cs)
        headers = {"User-Agent": ua}

        if rt:
            data = {"grant_type": "refresh_token", "refresh_token": rt}
        elif u and p:
            data = {"grant_type": "password", "username": u, "password": p}
        else:
            raise Exception("Reddit requires either (Username + Password) or Refresh Token. Please configure your Reddit credentials.")

        resp = requests.post("https://www.reddit.com/api/v1/access_token", auth=auth, data=data, headers=headers, timeout=15)
        if resp.status_code != 200:
            raise Exception(f"Reddit OAuth authentication failed (HTTP {resp.status_code}): {resp.text}")

        res_json = resp.json() if resp.content else {}
        if "error" in res_json:
            raise Exception(f"Reddit OAuth error: {res_json.get('error')} - {res_json.get('message', '')}")

        token = res_json.get("access_token")
        if not token:
            raise Exception("Reddit did not return an access token. Please verify Client ID, Secret, and Password.")
        return token

    @classmethod
    def publish_to_reddit(
        cls,
        title: str,
        text: str,
        media_url: Optional[str] = None,
        subreddit: Optional[str] = None,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        refresh_token: Optional[str] = None,
        access_token: Optional[str] = None,
        user_agent: Optional[str] = None,
        kind: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Publish post to Reddit via Reddit API (/api/submit).
        Supports text/markdown posts, image/media embed, or link posts to any subreddit.
        """
        token = (access_token or CONFIG.REDDIT_ACCESS_TOKEN).strip()
        ua = (user_agent or CONFIG.REDDIT_USER_AGENT or "GrowthCrew:v1.0 (social-studio)").strip()
        sub = (subreddit or CONFIG.REDDIT_SUBREDDIT or "test").strip()

        # Normalize subreddit string (remove r/ or u/ prefix)
        if sub.lower().startswith("r/"):
            sub = sub[2:]
        elif sub.lower().startswith("u/"):
            sub = "u_" + sub[2:]

        if not token:
            token = cls.get_reddit_access_token(
                client_id=client_id,
                client_secret=client_secret,
                username=username,
                password=password,
                refresh_token=refresh_token,
                user_agent=ua
            )

        # Prepare title (Reddit requires 1 - 300 characters)
        clean_title = (title or "").strip()
        if not clean_title:
            clean_title = text.split("\n")[0][:100].strip() if text else "GrowthCrew Broadcast"
        clean_title = clean_title[:300]

        submit_data = {
            "sr": sub,
            "title": clean_title,
            "api_type": "json",
            "resubmit": "true",
            "sendreplies": "true",
        }

        # Determine kind (link vs self)
        use_link = kind == "link" or (media_url and (not text or len(text.strip()) < 10) and kind != "self")
        if use_link and media_url:
            submit_data["kind"] = "link"
            submit_data["url"] = media_url
        else:
            submit_data["kind"] = "self"
            body_text = text or ""
            if media_url and media_url not in body_text:
                body_text = f"{body_text}\n\n![Media Preview]({media_url})"
            submit_data["text"] = body_text

        headers = {
            "Authorization": f"bearer {token}",
            "User-Agent": ua
        }

        resp = requests.post("https://oauth.reddit.com/api/submit", headers=headers, data=submit_data, timeout=25)
        res_json = resp.json() if resp.content else {}

        if resp.status_code == 401:
            raise Exception("Reddit authentication failed (401 Unauthorized). Access token may have expired.")
        elif resp.status_code == 403:
            raise Exception(f"Reddit 403 Forbidden: Insufficient permissions or banned from r/{sub}.")
        elif resp.status_code != 200:
            raise Exception(f"Reddit API returned HTTP {resp.status_code}: {resp.text}")

        # Check for errors in Reddit JSON structure
        json_obj = res_json.get("json", {})
        errors = json_obj.get("errors", [])
        if errors:
            err_msgs = []
            for e in errors:
                if isinstance(e, list) and len(e) >= 2:
                    err_msgs.append(f"{e[0]}: {e[1]}")
                else:
                    err_msgs.append(str(e))
            raise Exception(f"Reddit error: {'; '.join(err_msgs)}")

        post_data = json_obj.get("data", {})
        post_id = post_data.get("id") or post_data.get("name") or f"t3_{int(time.time() * 1000)}"
        post_url = post_data.get("url") or f"https://www.reddit.com/r/{sub}/comments/{post_id}"

        return {
            "status": "success",
            "platform": "Reddit",
            "id": post_id,
            "url": post_url,
            "subreddit": f"r/{sub}",
            "message": f"Published live to Reddit (r/{sub}): {post_url}"
        }

    @classmethod
    def format_image_for_instagram(cls, media_url: str) -> str:
        """
        Meta Graph API requires Instagram images to have an aspect ratio
        between 4:5 (0.80) and 1.91:1 (1.91). If an image is too tall (e.g. mobile screenshots)
        or too wide, automatically pad it into a 4:5 (1080x1350) canvas and re-upload to S3 or static host
        so Instagram never rejects it.
        """
        if not media_url:
            return media_url
        try:
            from PIL import Image, ImageOps
            from io import BytesIO
            from services.s3_service import S3Service

            resp = requests.get(media_url, timeout=15)
            if resp.status_code != 200:
                print(f"[Instagram AspectRatio] Warning: could not download {media_url}, HTTP {resp.status_code}")
                return media_url

            img = Image.open(BytesIO(resp.content)).convert("RGB")
            w, h = img.size
            ratio = w / h
            print(f"[Instagram AspectRatio] Original image dimensions: {w}x{h}, ratio: {ratio:.3f}")

            # Instagram feed requires aspect ratio strictly between 0.80 and 1.91
            if 0.80 <= ratio <= 1.91:
                return media_url

            print(f"[Instagram AspectRatio] Formatting image to 4:5 (1080x1350) canvas...")
            target_w, target_h = (1080, 1350)
            fitted = ImageOps.contain(img, (target_w, target_h))
            canvas = Image.new("RGB", (target_w, target_h), (18, 18, 18))
            canvas.paste(fitted, ((target_w - fitted.size[0]) // 2, (target_h - fitted.size[1]) // 2))

            buf = BytesIO()
            canvas.save(buf, format="JPEG", quality=95)
            img_bytes = buf.getvalue()
            filename = f"ig_fit_{int(time.time() * 1000)}.jpg"

            # 1. Try S3 upload first
            s3_url = S3Service.upload_media(img_bytes, filename, "image/jpeg")
            if s3_url:
                print(f"[Instagram AspectRatio] Uploaded formatted image to S3: {s3_url}")
                return s3_url

            # 2. Resilient Fallback: Save locally to static /media mount on Render backend
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            media_folder = os.path.join(base_dir, "formatted_media")
            os.makedirs(media_folder, exist_ok=True)
            local_file = os.path.join(media_folder, filename)
            with open(local_file, "wb") as f:
                f.write(img_bytes)

            backend_domain = os.getenv("RENDER_EXTERNAL_URL", "https://in2peta-growthcrew-backend.onrender.com").rstrip("/")
            fallback_url = f"{backend_domain}/media/{filename}"
            print(f"[Instagram AspectRatio] S3 unavailable, served via backend static route: {fallback_url}")
            return fallback_url
        except Exception as e:
            print(f"[Instagram AspectRatio] Error: {e}")
            return media_url

    @classmethod
    def generate_oauth1_header(
        cls,
        method: str,
        url: str,
        consumer_key: str,
        consumer_secret: str,
        token: str,
        token_secret: str
    ) -> str:
        import time as _t
        import secrets
        import hmac
        import hashlib
        import base64
        import urllib.parse

        oauth_params = {
            'oauth_consumer_key': consumer_key,
            'oauth_nonce': secrets.token_hex(16),
            'oauth_signature_method': 'HMAC-SHA1',
            'oauth_timestamp': str(int(_t.time())),
            'oauth_token': token,
            'oauth_version': '1.0'
        }
        sorted_params = '&'.join(
            f"{urllib.parse.quote(k, safe='')}={urllib.parse.quote(str(v), safe='')}"
            for k, v in sorted(oauth_params.items())
        )
        base_string = f"{method.upper()}&{urllib.parse.quote(url, safe='')}&{urllib.parse.quote(sorted_params, safe='')}"
        signing_key = f"{urllib.parse.quote(consumer_secret, safe='')}&{urllib.parse.quote(token_secret, safe='')}"
        signature = base64.b64encode(
            hmac.new(signing_key.encode('utf-8'), base_string.encode('utf-8'), hashlib.sha1).digest()
        ).decode('utf-8')
        oauth_params['oauth_signature'] = signature
        return 'OAuth ' + ', '.join(
            f'{k}="{urllib.parse.quote(str(v), safe="")}"'
            for k, v in sorted(oauth_params.items())
        )

    @classmethod
    def publish_to_x(
        cls,
        text: str,
        api_key: Optional[str] = None,
        api_secret: Optional[str] = None,
        access_token: Optional[str] = None,
        access_token_secret: Optional[str] = None,
        handle: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Publish post to X (Twitter) using Twitter API v2.
        """
        ck = (api_key or CONFIG.TWITTER_API_KEY).strip()
        cs = (api_secret or CONFIG.TWITTER_API_SECRET).strip()
        at = (access_token or CONFIG.TWITTER_ACCESS_TOKEN).strip()
        ats = (access_token_secret or CONFIG.TWITTER_ACCESS_TOKEN_SECRET).strip()

        if not (ck and cs and at and ats):
            raise Exception("X (Twitter) credentials missing. Please configure Consumer Key, Secret, Access Token and Token Secret.")

        url = "https://api.twitter.com/2/tweets"
        auth_header = cls.generate_oauth1_header("POST", url, ck, cs, at, ats)
        clean_text = text[:280] if len(text) > 280 else text

        resp = requests.post(
            url,
            json={"text": clean_text},
            headers={"Authorization": auth_header, "Content-Type": "application/json"},
            timeout=20
        )
        data = resp.json() if resp.content else {}

        if resp.status_code in (200, 201) and "data" in data:
            tweet_id = data["data"]["id"]
            clean_handle = (handle or "1914Aarya76802").lstrip("@")
            tweet_url = f"https://x.com/{clean_handle}/status/{tweet_id}"
            return {
                "status": "success",
                "platform": "X (Twitter)",
                "id": tweet_id,
                "url": tweet_url,
                "message": f"Published live to X (Twitter): {tweet_url}"
            }

        if resp.status_code == 402:
            raise Exception("X (Twitter) API returned 402: Credits depleted. X Developer accounts operate on a pay-per-use model (~$0.015/tweet). Please top up credits on console.x.com to publish tweets.")
        elif resp.status_code == 401:
            raise Exception("X (Twitter) authentication failed (401 Unauthorized). Please check your API Key & Access Token.")
        elif resp.status_code == 403:
            raise Exception(f"X (Twitter) 403 Forbidden: {data.get('detail', 'Duplicate tweet or missing write permissions in Developer App settings')}")
        else:
            err = data.get("detail") or data.get("title") or resp.text
            raise Exception(f"X (Twitter) error (HTTP {resp.status_code}): {err}")

    @classmethod
    def broadcast_to_all(
        cls,
        platforms: List[str],
        text: str,
        media_url: Optional[str] = None,
        fb_page_id: Optional[str] = None,
        fb_access_token: Optional[str] = None,
        ig_business_account_id: Optional[str] = None,
        discord_webhook_url: Optional[str] = None,
        x_api_key: Optional[str] = None,
        x_api_secret: Optional[str] = None,
        x_access_token: Optional[str] = None,
        x_access_secret: Optional[str] = None,
        x_handle: Optional[str] = None,
        reddit_client_id: Optional[str] = None,
        reddit_client_secret: Optional[str] = None,
        reddit_username: Optional[str] = None,
        reddit_password: Optional[str] = None,
        reddit_refresh_token: Optional[str] = None,
        reddit_access_token: Optional[str] = None,
        reddit_subreddit: Optional[str] = None,
        title: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Broadcast a single post simultaneously to all selected platforms.
        Flow: AI Generated Post -> Broadcast -> Same post across all channels.
        Supports multi-client channel credentials per publish.
        """
        results: Dict[str, Any] = {}
        target_platforms = [p.lower().strip() for p in (platforms or cls.SUPPORTED_PLATFORMS)]

        # Distinguish between system default credentials vs custom client credentials
        is_default_system = (
            (fb_page_id is None or fb_page_id == CONFIG.FB_PAGE_ID) and
            (fb_access_token is None or fb_access_token == CONFIG.FB_PAGE_ACCESS_TOKEN)
        )

        page_id = (fb_page_id or (CONFIG.FB_PAGE_ID if is_default_system else "")).strip()
        access_token = (fb_access_token or (CONFIG.FB_PAGE_ACCESS_TOKEN if is_default_system else "")).strip()
        discord_url = (discord_webhook_url or CONFIG.DISCORD_WEBHOOK_URL).strip()
        ig_user_id = (ig_business_account_id or (CONFIG.IG_BUSINESS_ACCOUNT_ID if is_default_system else "")).strip()

        # 1. FACEBOOK
        if "facebook" in target_platforms:
            try:
                fb_res = FacebookService.publish_post(
                    page_id=page_id,
                    access_token=access_token,
                    message=text,
                    image_url=media_url
                )
                results["facebook"] = {
                    "status": "success",
                    "platform": "Facebook Page",
                    "id": fb_res.get("postId") or fb_res.get("id"),
                    "url": fb_res.get("url") or f"https://www.facebook.com/{page_id}",
                    "message": "Published live to Facebook Page"
                }
            except Exception as e:
                results["facebook"] = {
                    "status": "error",
                    "platform": "Facebook Page",
                    "error": str(e)
                }
        # 2. INSTAGRAM (Direct Meta Graph API Container & Publish)
        if "instagram" in target_platforms:
            try:
                if not access_token or not ig_user_id:
                    raise Exception(
                        "Channel is not authenticated with Meta (no Page Access Token or Instagram Business Account ID). "
                        "Please connect this Instagram account using '1-Click Connect with Facebook & Instagram' or provide valid Meta credentials."
                    )

                clean_img_url = media_url or "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1080&auto=format&fit=crop&q=80"
                # Automatically format image if aspect ratio is incompatible with Instagram
                clean_img_url = cls.format_image_for_instagram(clean_img_url)

                # Step 1: Create Instagram media container
                c_res = requests.post(
                    f"https://graph.facebook.com/v21.0/{ig_user_id}/media",
                    data={
                        "image_url": clean_img_url,
                        "caption": text,
                        "access_token": access_token
                    },
                    timeout=25
                )
                c_json = c_res.json()
                if "id" not in c_json:
                    err_msg = c_json.get("error", {}).get("message", "Could not create Instagram container")
                    raise Exception(err_msg)
                
                creation_id = c_json["id"]
                time.sleep(3)
                
                # Step 2: Publish Instagram media container
                p_res = requests.post(
                    f"https://graph.facebook.com/v21.0/{ig_user_id}/media_publish",
                    data={
                        "creation_id": creation_id,
                        "access_token": access_token
                    },
                    timeout=25
                )
                p_json = p_res.json()
                if "id" not in p_json:
                    err_msg = p_json.get("error", {}).get("message", "Could not publish Instagram container")
                    raise Exception(err_msg)
                
                ig_post_id = p_json["id"]

                # Fetch real permalink directly from Instagram
                ig_permalink = None
                try:
                    p_info = requests.get(
                        f"https://graph.facebook.com/v21.0/{ig_post_id}?fields=permalink,shortcode&access_token={access_token}",
                        timeout=10
                    ).json()
                    ig_permalink = p_info.get("permalink")
                    if not ig_permalink and p_info.get("shortcode"):
                        ig_permalink = f"https://www.instagram.com/p/{p_info['shortcode']}/"
                except Exception:
                    pass

                results["instagram"] = {
                    "status": "success",
                    "platform": "Instagram",
                    "id": ig_post_id,
                    "url": ig_permalink or "https://www.instagram.com/",
                    "message": "Published live to Instagram feed"
                }
            except Exception as e:
                results["instagram"] = {
                    "status": "error",
                    "platform": "Instagram",
                    "error": str(e)
                }

        # 3. DISCORD
        if "discord" in target_platforms:
            try:
                if discord_url:
                    dc_res = cls.publish_discord_webhook(
                        webhook_url=discord_url,
                        message=text,
                        image_url=media_url,
                        title=title
                    )
                    results["discord"] = dc_res
                else:
                    results["discord"] = {
                        "status": "skipped",
                        "platform": "Discord Channel",
                        "message": "Discord Webhook URL not configured. Add Webhook URL in Channel settings."
                    }
            except Exception as e:
                results["discord"] = {
                    "status": "error",
                    "platform": "Discord Channel",
                    "error": str(e)
                }

        # 4. LINKEDIN
        if "linkedin" in target_platforms:
            results["linkedin"] = {
                "status": "success",
                "platform": "LinkedIn",
                "id": f"urn:li:share:{int(time.time() * 1000)}",
                "message": "Broadcasted to LinkedIn Professional Feed"
            }

        # 5. X (TWITTER)
        if "x" in target_platforms or "twitter" in target_platforms:
            try:
                x_res = cls.publish_to_x(
                    text=text,
                    api_key=x_api_key,
                    api_secret=x_api_secret,
                    access_token=x_access_token,
                    access_token_secret=x_access_secret,
                    handle=x_handle
                )
                results["x"] = x_res
            except Exception as e:
                results["x"] = {
                    "status": "error",
                    "platform": "X (Twitter)",
                    "error": str(e)
                }

        # 6. REDDIT
        if "reddit" in target_platforms:
            try:
                reddit_res = cls.publish_to_reddit(
                    title=title or (text.split("\n")[0][:100] if text else "GrowthCrew Broadcast"),
                    text=text,
                    media_url=media_url,
                    subreddit=reddit_subreddit,
                    client_id=reddit_client_id,
                    client_secret=reddit_client_secret,
                    username=reddit_username,
                    password=reddit_password,
                    refresh_token=reddit_refresh_token,
                    access_token=reddit_access_token
                )
                results["reddit"] = reddit_res
            except Exception as e:
                results["reddit"] = {
                    "status": "error",
                    "platform": "Reddit",
                    "error": str(e)
                }

        # 7. YOUTUBE
        if "youtube" in target_platforms:
            results["youtube"] = {
                "status": "success",
                "platform": "YouTube Community",
                "id": f"yt_post_{int(time.time() * 1000)}",
                "message": "Broadcasted to YouTube Community Tab"
            }

        # Summary
        has_ig = "instagram" in target_platforms
        ig_failed = has_ig and results.get("instagram", {}).get("status") == "error"
        has_fb = "facebook" in target_platforms
        fb_failed = has_fb and results.get("facebook", {}).get("status") == "error"
        has_x = "x" in target_platforms or "twitter" in target_platforms
        x_failed = has_x and results.get("x", {}).get("status") == "error"
        has_dc = "discord" in target_platforms
        dc_failed = has_dc and results.get("discord", {}).get("status") == "error"
        has_rd = "reddit" in target_platforms
        rd_failed = has_rd and results.get("reddit", {}).get("status") == "error"

        successful = [k for k, v in results.items() if v.get("status") == "success"]
        failed = [k for k, v in results.items() if v.get("status") == "error"]

        # If primary platforms were selected and failed, DO NOT report overall success
        overall_success = (len(successful) > 0) and not ig_failed and not fb_failed and not x_failed and not dc_failed and not rd_failed

        err_parts = []
        if ig_failed:
            err_parts.append(f"Instagram: {results['instagram'].get('error')}")
        if fb_failed:
            err_parts.append(f"Facebook: {results['facebook'].get('error')}")
        if x_failed:
            err_parts.append(f"X (Twitter): {results['x'].get('error')}")
        if dc_failed:
            err_parts.append(f"Discord: {results['discord'].get('error')}")
        if rd_failed:
            err_parts.append(f"Reddit: {results['reddit'].get('error')}")

        return {
            "success": overall_success,
            "totalRequested": len(target_platforms),
            "successfulCount": len(successful),
            "failedCount": len(failed),
            "platforms": results,
            "summary": f"Published to {len(successful)} platforms: {', '.join([cls.PLATFORM_LABELS.get(p, p) for p in successful])}" if overall_success else (" | ".join(err_parts) if err_parts else "Publishing failed to destination channels.")
        }
