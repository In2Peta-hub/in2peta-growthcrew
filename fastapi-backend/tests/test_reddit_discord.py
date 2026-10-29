import pytest
from unittest.mock import patch, MagicMock
from services.multi_platform_service import MultiPlatformPublisher

def test_discord_webhook_missing_url():
    res = MultiPlatformPublisher.publish_discord_webhook("", "Test message")
    assert res.get("status") == "skipped"

def test_discord_webhook_success():
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.content = b'{"id": "msg_999", "channel_id": "chan_123", "guild_id": "guild_456"}'
    mock_resp.json.return_value = {"id": "msg_999", "channel_id": "chan_123", "guild_id": "guild_456"}

    with patch("requests.post", return_value=mock_resp) as mock_post:
        res = MultiPlatformPublisher.publish_discord_webhook(
            webhook_url="https://discord.com/api/webhooks/123/abc",
            message="Hello Discord!",
            image_url="https://example.com/img.jpg",
            title="Important Announcement"
        )
        assert res.get("status") == "success"
        assert res.get("id") == "msg_999"
        assert "channels/guild_456/chan_123/msg_999" in res.get("url")

        call_args, call_kwargs = mock_post.call_args
        assert "?wait=true" in call_args[0]
        payload = call_kwargs["json"]
        assert payload["embeds"][0]["title"] == "Important Announcement"
        assert payload["embeds"][0]["image"]["url"] == "https://example.com/img.jpg"

def test_reddit_missing_credentials():
    with pytest.raises(Exception) as exc_info:
        MultiPlatformPublisher.publish_to_reddit(
            title="Reddit Post",
            text="Some body text",
            client_id="",
            client_secret=""
        )
    assert "Reddit Client ID and Client Secret are required" in str(exc_info.value)

def test_reddit_publish_success_with_token():
    mock_submit_resp = MagicMock()
    mock_submit_resp.status_code = 200
    mock_submit_resp.content = b'{"json": {"errors": [], "data": {"id": "t3_abc123", "url": "https://www.reddit.com/r/test/comments/abc123/test_title/"}}}'
    mock_submit_resp.json.return_value = {
        "json": {
            "errors": [],
            "data": {
                "id": "t3_abc123",
                "name": "t3_abc123",
                "url": "https://www.reddit.com/r/test/comments/abc123/test_title/"
            }
        }
    }

    with patch("requests.post", return_value=mock_submit_resp) as mock_post:
        res = MultiPlatformPublisher.publish_to_reddit(
            title="Test Reddit Title",
            text="Here is the post content.",
            media_url="https://example.com/reddit_image.jpg",
            subreddit="r/test",
            access_token="test_bearer_token"
        )
        assert res.get("status") == "success"
        assert res.get("id") == "t3_abc123"
        assert "reddit.com/r/test" in res.get("url")
        assert res.get("subreddit") == "r/test"

        call_args, call_kwargs = mock_post.call_args
        assert call_args[0] == "https://oauth.reddit.com/api/submit"
        assert call_kwargs["headers"]["Authorization"] == "bearer test_bearer_token"
        assert call_kwargs["data"]["sr"] == "test"
        assert call_kwargs["data"]["title"] == "Test Reddit Title"
        assert call_kwargs["data"]["kind"] == "self"
        assert "https://example.com/reddit_image.jpg" in call_kwargs["data"]["text"]

def test_broadcast_to_all_with_discord_and_reddit():
    mock_discord = {
        "status": "success",
        "platform": "Discord Channel",
        "id": "dc_123",
        "url": "https://discord.com/channels/1/2/3"
    }
    mock_reddit = {
        "status": "success",
        "platform": "Reddit",
        "id": "t3_999",
        "url": "https://reddit.com/r/test/comments/999"
    }

    with patch.object(MultiPlatformPublisher, "publish_discord_webhook", return_value=mock_discord), \
         patch.object(MultiPlatformPublisher, "publish_to_reddit", return_value=mock_reddit):
        res = MultiPlatformPublisher.broadcast_to_all(
            platforms=["discord", "reddit"],
            text="Cross-platform announcement",
            discord_webhook_url="https://discord.com/api/webhooks/test",
            reddit_subreddit="test"
        )
        assert res.get("success") is True
        assert res.get("successfulCount") == 2
        assert "discord" in res.get("platforms")
        assert "reddit" in res.get("platforms")
