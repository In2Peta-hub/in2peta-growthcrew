import time
import random
import string
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from storage import JsonStore

DEFAULT_DATA: Dict[str, Any] = {
    "settings": {
        "autoApprove": False,
        "isQueuePaused": False,
        "defaultScheduleDelayHours": 2,
        "preferredTone": "Warm & Engaging",
        "instagramHandle": "@growthcrew.official",
    },
    "channels": [
        {
            "id": "cmu2huh5o0001p0aq03ly15ud",
            "name": "Mytestpage",
            "handle": "@mytestpage",
            "platform": "instagram",
            "platforms": ["instagram", "facebook"],
            "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
            "connected": True,
            "provider": "Meta Graph API"
        }
    ],
    "queue": []
}

STORE = JsonStore("data.json", DEFAULT_DATA)


class QueueService:
    """Social-studio queue/channels/settings, persisted through the shared store."""

    @classmethod
    def init(cls):
        if not STORE.path.exists():
            STORE.write(DEFAULT_DATA)

    @classmethod
    def read_data(cls) -> Dict[str, Any]:
        return STORE.read()

    @classmethod
    def write_data(cls, data: Dict[str, Any]):
        STORE.write(data)

    @classmethod
    def get_settings(cls) -> Dict[str, Any]:
        data = cls.read_data()
        return data.get("settings", DEFAULT_DATA["settings"])

    @classmethod
    def update_settings(cls, new_settings: Dict[str, Any]) -> Dict[str, Any]:
        data = cls.read_data()
        data["settings"] = {**data.get("settings", {}), **new_settings}
        cls.write_data(data)
        return data["settings"]

    @classmethod
    def get_queue(cls, filter_status: Optional[str] = None) -> List[Dict[str, Any]]:
        data = cls.read_data()
        queue = data.get("queue", [])
        if filter_status:
            return [p for p in queue if p.get("status") == filter_status]
        return queue

    @classmethod
    def get_post_by_id(cls, post_id: str) -> Optional[Dict[str, Any]]:
        data = cls.read_data()
        for p in data.get("queue", []):
            if p.get("id") == post_id:
                return p
        return None

    @classmethod
    def add_to_queue(cls, post_item: Dict[str, Any]) -> Dict[str, Any]:
        data = cls.read_data()
        rand_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=5))
        post_id = f"post_{int(time.time() * 1000)}_{rand_str}"
        now = datetime.now(timezone.utc).isoformat()

        full_text = "\n\n".join(filter(None, [
            post_item.get("hook", ""),
            post_item.get("caption") or post_item.get("content", ""),
            post_item.get("callToAction", ""),
            " ".join(post_item.get("hashtags", []))
        ]))

        new_post = {
            "id": post_id,
            "topic": post_item.get("topic", "Untitled Post"),
            "hook": post_item.get("hook", ""),
            "caption": post_item.get("caption") or post_item.get("content", ""),
            "hashtags": post_item.get("hashtags", []),
            "callToAction": post_item.get("callToAction", ""),
            "format": post_item.get("format", "feed"),
            "visualPrompt": post_item.get("visualPrompt", ""),
            "visualKeyword": post_item.get("visualKeyword", ""),
            "visualUrl": post_item.get("visualUrl"),
            "reelStoryboard": post_item.get("reelStoryboard"),
            "fullPostText": post_item.get("fullPostText") or full_text,
            "integrationId": post_item.get("integrationId"),
            "integrationName": post_item.get("integrationName", "Instagram Account"),
            "platform": post_item.get("platform", "instagram"),
            "platforms": post_item.get("platforms", [post_item.get("platform", "instagram")]),
            "scheduledDate": post_item.get("scheduledDate"),
            "status": post_item.get("status", "PENDING_REVIEW"),
            "postizPostId": post_item.get("postizPostId"),
            "postizMediaId": post_item.get("postizMediaId"),
            "createdAt": now,
            "updatedAt": now,
            "reviewNotes": post_item.get("reviewNotes", ""),
        }

        queue = data.get("queue", [])
        queue.insert(0, new_post)
        data["queue"] = queue
        cls.write_data(data)
        return new_post

    @classmethod
    def update_post(cls, post_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        data = cls.read_data()
        queue = data.get("queue", [])
        for i, p in enumerate(queue):
            if p.get("id") == post_id:
                updated = {**p, **updates, "updatedAt": datetime.now(timezone.utc).isoformat()}
                if any(k in updates for k in ("hook", "caption", "content", "callToAction", "hashtags")):
                    updated["fullPostText"] = "\n\n".join(filter(None, [
                        updated.get("hook", ""),
                        updated.get("caption") or updated.get("content", ""),
                        updated.get("callToAction", ""),
                        " ".join(updated.get("hashtags", []))
                    ]))
                queue[i] = updated
                data["queue"] = queue
                cls.write_data(data)
                return updated
        return None

    @classmethod
    def delete_post(cls, post_id: str) -> bool:
        data = cls.read_data()
        queue = data.get("queue", [])
        new_queue = [p for p in queue if p.get("id") != post_id]
        if len(new_queue) != len(queue):
            data["queue"] = new_queue
            cls.write_data(data)
            return True
        return False

    @classmethod
    def get_channels(cls) -> List[Dict[str, Any]]:
        data = cls.read_data()
        return data.get("channels", DEFAULT_DATA["channels"])

    @classmethod
    def save_channels(cls, channels: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        data = cls.read_data()
        data["channels"] = channels
        cls.write_data(data)
        return channels

    @classmethod
    def add_channel(cls, channel: Dict[str, Any]) -> List[Dict[str, Any]]:
        data = cls.read_data()
        channels = data.get("channels", [])
        ch_id = channel.get("id", "cmu2huh5o0001p0aq03ly15ud")
        ch_name = channel.get("name", "Mytestpage")
        clean_handle = f"@{ch_name.lower()}"

        new_ch = {
            "id": ch_id,
            "name": ch_name,
            "handle": channel.get("handle") or clean_handle,
            "platform": channel.get("platform", "instagram"),
            "platforms": channel.get("platforms", ["instagram", "facebook"]),
            "avatar": channel.get("avatar", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"),
            "connected": True,
            "provider": "Meta Graph API"
        }

        existing_index = next((i for i, c in enumerate(channels) if c.get("id") == ch_id or c.get("name", "").lower() == ch_name.lower()), -1)
        if existing_index >= 0:
            channels[existing_index] = {**channels[existing_index], **new_ch, "connected": True}
        else:
            channels.append(new_ch)

        data["channels"] = channels
        cls.write_data(data)
        return channels
