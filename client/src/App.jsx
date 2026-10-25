import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  ExternalLink,
  Send,
  RefreshCw,
  Layers,
  Calendar,
  Info,
  Check,
  ArrowRight,
  HelpCircle,
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  Upload,
  Share2,
  Clock,
  CloudUpload,
  LogOut,
  X,
  ChevronDown,
  ThumbsUp,
  Repeat2,
  BarChart3,
  ArrowBigUp,
  ArrowBigDown,
  Loader2
} from 'lucide-react';
import LoginPage from './LoginPage';
import LandingPage from './LandingPage';
import ReviewScreen from './finder/ReviewScreen';
import WorkspaceHome from './marketing/WorkspaceHome';
import ComingSoon from './marketing/ComingSoon';
import WorkspaceNav from './marketing/WorkspaceNav';
import { getModule } from './features';
import { clearSession, getSession, verifySignIn, setSession } from './finder/finderApi';
import { API_BASE } from './api';
import Segmented from './ui/Segmented';

// Custom SVG Icons for Multi-Platform Social Channels
const InstagramIcon = ({ className = 'w-4 h-4', ...props }) => (
  <svg {...props} aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ className = 'w-4 h-4', ...props }) => (
  <svg {...props} aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const LinkedInIcon = ({ className = 'w-4 h-4', ...props }) => (
  <svg {...props} aria-hidden="true" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37h2.79V10.9H6.46M7.86 6.54a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26z" />
  </svg>
);

const XIcon = ({ className = 'w-4 h-4', ...props }) => (
  <svg {...props} aria-hidden="true" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const RedditIcon = ({ className = 'w-4 h-4', ...props }) => (
  <svg {...props} aria-hidden="true" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm6.2 12.3c.1.3.1.5.1.7 0 2.4-2.8 4.3-6.3 4.3s-6.3-1.9-6.3-4.3c0-.2 0-.5.1-.7-.6-.4-1-.9-1-1.6 0-1.1.9-2 2-2 .5 0 1 .2 1.3.6 1-.7 2.4-1.2 3.9-1.3l.8-3.7 2.6.6c.1-.6.7-1 1.4-1 1.1 0 2 .9 2 2s-.9 2-2 2c-.6 0-1.1-.3-1.4-.8l-2-.5-.6 2.8c1.5.1 2.8.6 3.8 1.3.4-.4.8-.6 1.4-.6 1.1 0 2 .9 2 2 0 .7-.4 1.2-1 1.6z" />
  </svg>
);

const YouTubeIcon = ({ className = 'w-4 h-4', ...props }) => (
  <svg {...props} aria-hidden="true" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const DiscordIcon = ({ className = 'w-4 h-4', ...props }) => (
  <svg {...props} aria-hidden="true" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const ALL_PLATFORMS = [
  { id: 'facebook', name: 'Facebook Page', color: '#1877F2', icon: FacebookIcon },
  { id: 'instagram', name: 'Instagram', color: '#E1306C', icon: InstagramIcon },
  { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2', icon: LinkedInIcon },
  { id: 'x', name: 'X (Twitter)', color: '#FFFFFF', icon: XIcon },
  { id: 'reddit', name: 'Reddit', color: '#FF4500', icon: RedditIcon },
  { id: 'youtube', name: 'YouTube', color: '#FF0000', icon: YouTubeIcon },
  { id: 'discord', name: 'Discord', color: '#5865F2', icon: DiscordIcon },
];
const IN2PETA_EXPLORE_URL = 'https://www.in2peta.com/explore';

// Pre-curated inspiration topics for instant captions
const INSPIRATION_CHIPS = [
  'HVAC Summer Tune-Up 20% Off Special',
  '3 Signs Your AC Needs Urgent Service',
  'Energy-Saving Tips to Lower Electric Bills',
  'Behind the Scenes: A Day with Our Master Technicians',
  'Customer Spotlight: Total Modern Home Transformation',
];

// Sample showcase visuals generated from Growthcrew AI
const SAMPLE_IN2PETA_MEDIA = [
  {
    name: 'HVAC Technician',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1080&auto=format&fit=crop&q=80',
  },
  {
    name: 'Modern Home Living',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1080&auto=format&fit=crop&q=80',
  },
  {
    name: 'AC Unit Precision Repair',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1080&auto=format&fit=crop&q=80',
  },
];

// Social Studio. Reached only from the account menu on the review screen.
function SocialStudio({ currentUser, onBack, onLogout, onNavigate, defaultTab = 'studio' }) {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'studio' | 'queue' | 'history'
  const [showBeginnerGuide, setShowBeginnerGuide] = useState(true);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  useEffect(() => {
    if (!accountMenuOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
        accountMenuRef.current?.querySelector('button')?.focus();
      }
    };
    const closeOnOutside = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) setAccountMenuOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnOutside);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnOutside);
    };
  }, [accountMenuOpen]);

  // Channels & Account
  const [channels, setChannels] = useState([
    {
      id: 'cmu2huh5o0001p0aq03ly15ud',
      name: 'Mytestpage (Instagram)',
      handle: '@mytestpage',
      platform: 'instagram',
      platforms: ['instagram'],
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      connected: true,
      provider: 'Meta Graph API',
    },
    {
      id: 'cmu2huh5o0002p0aq03lyfb01',
      name: 'Mytestpage (Facebook Page)',
      handle: '@mytestpage.fb',
      platform: 'facebook',
      platforms: ['facebook'],
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      connected: true,
      provider: 'Meta Graph API',
    },
  ]);
  const [activeChannel, setActiveChannel] = useState(channels[0]);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [customHandleInput, setCustomHandleInput] = useState('');
  const [customPlatform, setCustomPlatform] = useState('instagram');

  // Settings & Queue
  const [settings, setSettings] = useState({ autoApprove: false });
  const [queueData, setQueueData] = useState({ counts: {}, queue: [] });
  const [publishedPosts, setPublishedPosts] = useState([]);
  const [healthInfo, setHealthInfo] = useState(null);

  // STEP 1: Growthcrew Media
  const [attachedMediaUrl, setAttachedMediaUrl] = useState(SAMPLE_IN2PETA_MEDIA[0].url);
  const [attachedMediaId, setAttachedMediaId] = useState(null);
  const [attachedMediaType, setAttachedMediaType] = useState('image'); // 'image' | 'video'
  const [mediaSourceType, setMediaSourceType] = useState('sample'); // 'sample' | 'url' | 'upload'
  const [pastedUrlInput, setPastedUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // STEP 2: AI Caption Generator
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Warm & Engaging');
  const [callToAction, setCallToAction] = useState('Drop a comment below or tap the link in bio!');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState(null);
  const [editHook, setEditHook] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editHashtags, setEditHashtags] = useState('');

  // Aspect ratio & Target Platform (All 7 Supported Channels)
  const [aspectRatio, setAspectRatio] = useState('portrait'); // 'square' | 'portrait' | 'reel'
  const [selectedPlatforms, setSelectedPlatforms] = useState([
    'facebook',
    'instagram',
    'linkedin',
    'x',
    'reddit',
    'youtube',
    'discord',
  ]);
  const [activePreviewPlatform, setActivePreviewPlatform] = useState('instagram');
  const [broadcastModalData, setBroadcastModalData] = useState(null);
  const [expandedCaption, setExpandedCaption] = useState(false);

  // Custom channel credentials input state
  const [customFbPageId, setCustomFbPageId] = useState('');
  const [customFbToken, setCustomFbToken] = useState('');
  const [customDiscordWebhook, setCustomDiscordWebhook] = useState('');

  // Queue & Modals
  const [queueFilter, setQueueFilter] = useState('ALL');
  const [editingPost, setEditingPost] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Initial Data Fetch
  const fetchData = async () => {
    try {
      const [settingsRes, channelsRes, queueRes, pubRes, healthRes] = await Promise.all([
        fetch(`${API_BASE}/api/settings`),
        fetch(`${API_BASE}/api/channels`),
        fetch(`${API_BASE}/api/queue`),
        fetch(`${API_BASE}/api/published`),
        fetch(`${API_BASE}/api/health`),
      ]);

      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (channelsRes.ok) {
        const ch = await channelsRes.json();
        if (Array.isArray(ch) && ch.length > 0) {
          setChannels(ch);
          if (!activeChannel) setActiveChannel(ch[0]);
        }
      }
      if (queueRes.ok) setQueueData(await queueRes.json());
      if (pubRes.ok) setPublishedPosts(await pubRes.json());
      if (healthRes.ok) setHealthInfo(await healthRes.json());
    } catch {
      // Standalone mode
    }
  };

  useEffect(() => {
    // Check Meta 1-Click OAuth callback parameters
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('oauth_success') === 'true') {
        const chanName = params.get('channel_name') || 'Meta Account';
        showToast(`🎉 Connected ${chanName} successfully via 1-Click OAuth!`, 'success');
        fetchData();
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (params.get('oauth_error')) {
        showToast(decodeURIComponent(params.get('oauth_error')), 'error');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch {
      // Ignore URL parsing errors
    }

    fetchData();
    const interval = setInterval(fetchData, 12000);
    return () => clearInterval(interval);
  }, []);

  // Handle Connecting Custom Channel & Credentials
  const handleConnectInstagram = async (e) => {
    e.preventDefault();
    if (!customHandleInput.trim() && !customFbPageId.trim() && !customDiscordWebhook.trim()) {
      showToast('Please provide a handle, Page ID, or Webhook URL to connect.', 'error');
      return;
    }
    const formatted = customHandleInput.trim().replace(/^@/, '');
    const cleanPlatform = customPlatform.toLowerCase();
    const platName = ALL_PLATFORMS.find((p) => p.id === cleanPlatform)?.name || cleanPlatform;
    
    try {
      const res = await fetch(`${API_BASE}/api/channels/custom-connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: cleanPlatform,
          handle: formatted ? `@${formatted}` : `@${cleanPlatform}`,
          name: formatted ? `${formatted} (${platName})` : `My ${platName}`,
          fbPageId: customFbPageId.trim() || undefined,
          fbAccessToken: customFbToken.trim() || undefined,
          discordWebhookUrl: customDiscordWebhook.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.channels && Array.isArray(data.channels)) {
        setChannels(data.channels);
        setActiveChannel(data.channel || data.channels[data.channels.length - 1]);
      } else {
        const fallbackChan = {
          id: `custom_${Date.now()}`,
          name: formatted ? `${formatted} (${platName})` : `My ${platName}`,
          handle: formatted ? `@${formatted}` : `@${cleanPlatform}`,
          platform: cleanPlatform,
          platforms: [cleanPlatform],
          avatar: attachedMediaUrl || SAMPLE_IN2PETA_MEDIA[0].url,
          connected: true,
          provider: 'Custom Connected',
        };
        setChannels((prev) => [...prev, fallbackChan]);
        setActiveChannel(fallbackChan);
      }

      setShowConnectModal(false);
      setCustomHandleInput('');
      setCustomFbPageId('');
      setCustomFbToken('');
      setCustomDiscordWebhook('');
      fetchData();
      showToast(`Connected ${platName} channel successfully!`, 'success');
    } catch {
      showToast(`Connected ${cleanPlatform} channel.`, 'success');
      setShowConnectModal(false);
    }
  };

  // Handle Toggle Auto-Approve
  const handleToggleAutoApprove = async () => {
    const newVal = !settings.autoApprove;
    setSettings((prev) => ({ ...prev, autoApprove: newVal }));
    try {
      await fetch(`${API_BASE}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoApprove: newVal }),
      });
      showToast(newVal ? 'Auto-publish on.' : 'Review before publish.', 'info');
    } catch {
      showToast('Settings updated.', 'info');
    }
  };

  // Handle Media File Upload (AWS S3 Direct Upload)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');
    const localBlobUrl = URL.createObjectURL(file);
    setAttachedMediaUrl(localBlobUrl);
    setAttachedMediaType(isVideo ? 'video' : 'image');
    setMediaSourceType('upload');
    setIsUploading(true);

    const formData = new FormData();
    formData.append('media', file);

    try {
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setAttachedMediaUrl(data.url);
        setAttachedMediaId(data.postizMediaId || null);
        showToast(`${isVideo ? 'Video' : 'Image'} uploaded.`, 'success');
      } else {
        showToast(data.error || 'Upload failed. Using local preview.', 'error');
      }
    } catch {
      showToast('Upload notice: local preview active.', 'info');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Pasting Media URL
  const handlePasteUrlSubmit = (e) => {
    e.preventDefault();
    if (!pastedUrlInput.trim()) return;

    const isVideo =
      pastedUrlInput.endsWith('.mp4') ||
      pastedUrlInput.endsWith('.webm') ||
      pastedUrlInput.endsWith('.mov') ||
      pastedUrlInput.includes('video');

    setAttachedMediaUrl(pastedUrlInput.trim());
    setAttachedMediaId(null);
    setAttachedMediaType(isVideo ? 'video' : 'image');
    setMediaSourceType('url');
    showToast('Media attached.', 'success');
  };

  // Generate Post Caption with Gemini AI
  const handleGenerateCaption = async (overrideTopic) => {
    const activeTopic = overrideTopic || topic;
    if (!activeTopic.trim()) {
      showToast('Please enter a topic or click one of the inspiration chips.', 'error');
      return;
    }

    if (isUploading) {
      showToast('Media is still uploading…', 'info');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: activeTopic,
          tone,
          callToAction,
          mediaUrl: attachedMediaUrl,
          mediaId: attachedMediaId,
          postizMediaId: attachedMediaId,
          mediaType: attachedMediaType,
          platforms: selectedPlatforms,
          scheduledDate: new Date(scheduledDate).toISOString(),
          integrationId: activeChannel?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      const g = data.generated;
      setGeneratedDraft(data);
      setEditHook(g.hook || '');
      setEditCaption(g.caption || '');
      setEditHashtags((g.hashtags || []).join(' '));

      fetchData();

      if (settings.autoApprove) {
        showToast('Published.', 'success');
        setActiveTab('history');
      } else {
        showToast('Caption ready.', 'success');
      }
    } catch (err) {
      showToast(`Notice: ${err.message || 'Error occurred.'}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Schedule Post Action
  const handleSchedulePost = async () => {
    const activeDraft = generatedDraft;
    const finalCaption = `${editHook}\n\n${editCaption}\n\n${editHashtags}`.trim();

    if (!finalCaption) {
      showToast('Please generate or write a caption before scheduling.', 'error');
      return;
    }

    setActionLoading('schedule');
    try {
      const res = await fetch(`${API_BASE}/api/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeDraft?.id || `post_${Date.now()}`,
          topic: activeDraft?.topic || topic || 'Custom Post',
          caption: finalCaption,
          hook: editHook,
          hashtags: editHashtags.split(' ').filter(Boolean),
          mediaUrl: attachedMediaUrl,
          mediaType: attachedMediaType,
          platforms: selectedPlatforms,
          scheduledDate: new Date(scheduledDate).toISOString(),
          status: 'SCHEDULED',
          channelName: activeChannel?.name || 'Mytestpage',
          integrationId: activeChannel?.id,
        }),
      });

      if (!res.ok) throw new Error('Could not schedule post');
      showToast(`Post scheduled for ${new Date(scheduledDate).toLocaleString()}.`, 'success');
      fetchData();
      setActiveTab('queue');
    } catch {
      showToast('Saved to schedule queue.', 'success');
      setActiveTab('queue');
    } finally {
      setActionLoading(null);
    }
  };

  // Instant Publish Action
  const handleInstantPublish = async (postId) => {
    setActionLoading(`pub_${postId || 'direct'}`);
    const finalCaption = `${editHook}\n\n${editCaption}\n\n${editHashtags}`.trim();
    const activeDraftId = (postId && postId !== 'new') ? postId : (generatedDraft?.post?.id || null);

    try {
      let res;
      if (activeDraftId) {
        if (finalCaption) {
          await fetch(`${API_BASE}/api/queue/${activeDraftId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              hook: editHook,
              caption: editCaption,
              hashtags: editHashtags.split(' ').filter(Boolean),
              visualUrl: attachedMediaUrl,
              mediaUrl: attachedMediaUrl,
              platforms: selectedPlatforms,
              integrationId: activeChannel?.id,
            }),
          }).catch(() => {});
        }
        res = await fetch(`${API_BASE}/api/queue/${activeDraftId}/publish-now`, { method: 'POST' });
      } else {
        res = await fetch(`${API_BASE}/api/publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: topic || 'Direct Studio Post',
            hook: editHook,
            caption: editCaption,
            hashtags: editHashtags.split(' ').filter(Boolean),
            fullPostText: finalCaption || 'GrowthCrew social post',
            mediaUrl: attachedMediaUrl,
            visualUrl: attachedMediaUrl,
            mediaType: attachedMediaType,
            platforms: selectedPlatforms,
            channelName: activeChannel?.name || 'Mytestpage',
            integrationId: activeChannel?.id,
            status: 'PUBLISHED',
          }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || 'Publish failed');
      if (data.broadcastResult) {
        setBroadcastModalData(data.broadcastResult);
        showToast('Publishing results are ready.', 'success');
      } else {
        showToast('Published successfully.', 'success');
      }
      fetchData();
      setActiveTab('history');
    } catch (err) {
      showToast(`Publishing notice: ${err.message}`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Approve Post in Queue
  const handleApprovePost = async (postId) => {
    setActionLoading(`approve_${postId}`);
    try {
      await fetch(`${API_BASE}/api/queue/${postId}/approve`, { method: 'POST' });
      showToast('Approved.', 'success');
      fetchData();
    } catch {
      showToast('Status updated.', 'info');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId) => {
    try {
      await fetch(`${API_BASE}/api/queue/${postId}`, { method: 'DELETE' });
      showToast('Post removed from queue.', 'info');
      fetchData();
    } catch {
      showToast('Removed.', 'info');
    }
  };

  // Save Post Edit
  const handleSaveEdit = async () => {
    if (!editingPost) return;
    try {
      await fetch(`${API_BASE}/api/queue/${editingPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPost),
      });
      showToast('Post updated successfully.', 'success');
      setEditingPost(null);
      fetchData();
    } catch {
      showToast('Changes saved.', 'info');
      setEditingPost(null);
    }
  };

  const queueList = queueData.queue || [];
  const pendingCount = queueList.filter((p) => p.status === 'PENDING_REVIEW').length;
  const filteredQueue =
    queueFilter === 'ALL'
      ? queueList
      : queueList.filter((p) => p.status === queueFilter);

  return (
    <div className="min-h-screen bg-[var(--ui-bg)] text-[var(--ui-ink)] flex flex-col font-sans antialiased">
      {toast && (
        <div role="status" className="ui-toast fixed end-4 [inset-block-end:1rem] z-50 flex items-center gap-3 px-4 py-3 max-w-[min(25rem,calc(100vw-2rem))]">
          {toast.type === 'error' ? <XCircle className="w-5 h-5 text-[var(--ui-bad)] shrink-0" /> : toast.type === 'info' ? <Info className="w-5 h-5 text-[var(--ui-lavender)] shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-[var(--ui-good)] shrink-0" />}
          <span className="text-sm">{toast.message}</span>
        </div>
      )}

      <div className="sticky [inset-block-start:0] z-40 bg-[var(--ui-surface)]">
      <header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-18 flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={onBack} className="ui-btn ui-btn-ghost ui-btn-icon shrink-0" aria-label="Back to your leads">
              <img className="brand-logo" src="/brand/in2peta-logo.png" alt="" width="40" height="40" />
            </button>
            <h1 className="ui-panel-title truncate text-base sm:text-lg">GrowthCrew <span className="hidden sm:inline text-[var(--ui-muted)] font-normal">/ Social Studio</span></h1>
            <button type="button" onClick={onBack} className="ui-btn ui-btn-ghost ui-btn-sm hidden sm:inline-flex">
              <ArrowRight className="rotate-180" aria-hidden="true" /> Back to your leads
            </button>
          </div>
          <div className="flex items-center gap-2 shrink-0 max-sm:ms-auto">
                <a href={IN2PETA_EXPLORE_URL} target="_blank" rel="noopener noreferrer" className="ui-link text-[13px] hidden sm:inline-flex items-center gap-1.5">
                  Explore models <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
                <button type="button" onClick={() => setShowConnectModal(true)} className="ui-btn ui-btn-ghost ui-btn-sm" aria-label="Switch channel">
                  <img src={activeChannel?.avatar || SAMPLE_IN2PETA_MEDIA[0].url} alt="" className="w-6 h-6 rounded-full object-cover" />
                  <span className="hidden sm:inline max-w-28 truncate">{activeChannel?.handle || '@mytestpage'}</span>
                  <ChevronDown aria-hidden="true" />
                </button>
                <button type="button" onClick={handleToggleAutoApprove} role="switch" aria-label="Auto-publish" aria-checked={!!settings.autoApprove} className="ui-btn ui-btn-ghost ui-btn-sm max-sm:!w-10 max-sm:!px-0" title={settings.autoApprove ? 'Auto-publish on' : 'Review before publish'}>
                  <span className={`ui-dot ${settings.autoApprove ? 'text-[var(--ui-good)]' : 'text-[var(--ui-faint)]'}`} />
                  <span className="hidden md:inline">{settings.autoApprove ? 'Auto-publish on' : 'Review before publish'}</span>
                  <span className="hidden sm:inline md:hidden">Auto-publish</span>
                </button>
            <div className="relative" ref={accountMenuRef}>
              <button type="button" onClick={() => setAccountMenuOpen((open) => !open)} aria-expanded={accountMenuOpen} aria-haspopup="menu" aria-label={`Account menu for ${currentUser.email}`} className="ui-btn ui-btn-ghost ui-btn-icon rounded-full bg-[var(--ui-raised)]">
                {currentUser.initial}
              </button>
              {accountMenuOpen && (
                <div role="menu" className="ui-menu absolute end-0 [inset-block-start:100%] mt-2 w-60 z-50" style={{ '--ui-origin': 'top right' }}>
                  <div className="px-3 py-2">
                    <p className="ui-hint truncate">{currentUser.email}</p>
                  </div>
                  <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); onNavigate?.('workspace'); }} className="ui-menu-item">
                    <Layers aria-hidden="true" className="w-4 h-4" /> Workspace
                  </button>
                  <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); onBack(); }} className="ui-menu-item">
                    <ArrowRight className="rotate-180 w-4 h-4" aria-hidden="true" /> Back to your leads
                  </button>
                  <button type="button" role="menuitem" onClick={() => { setAccountMenuOpen(false); onLogout(); }} className="ui-menu-item">
                    <LogOut aria-hidden="true" className="w-4 h-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <WorkspaceNav active="social" onNavigate={onNavigate} sticky={false} width="80rem" />

      <nav aria-label="Social Studio">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2 py-2">
          <div className="ui-tabs max-w-full" aria-label="Social Studio views">
              <button type="button" onClick={() => setActiveTab('studio')} className="ui-tab" aria-selected={activeTab === 'studio'}><Sparkles aria-hidden="true" /> Create post</button>
              <button type="button" onClick={() => setActiveTab('queue')} className="ui-tab" aria-selected={activeTab === 'queue'}><Layers aria-hidden="true" /> Review & queue {pendingCount > 0 && <span className="ui-badge">{pendingCount}</span>}</button>
              <button type="button" onClick={() => setActiveTab('history')} className="ui-tab" aria-selected={activeTab === 'history'}><CheckCircle2 aria-hidden="true" /> Published posts <span className="ui-badge">{publishedPosts.length}</span></button>
          </div>
          <button type="button" onClick={() => setShowBeginnerGuide(!showBeginnerGuide)} className="ui-btn ui-btn-ghost ui-btn-sm hidden lg:inline-flex"><HelpCircle aria-hidden="true" />{showBeginnerGuide ? 'Hide guide' : 'Workflow guide'}</button>
        </div>
      </nav>
      </div>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Workflow guide */}
        {showBeginnerGuide && (
          <div className="ui-panel space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="ui-panel-title">How it works</h2>
              <button
                type="button"
                onClick={() => setShowBeginnerGuide(false)}
                className="ui-btn ui-btn-ghost ui-btn-sm"
              >
                Dismiss <X aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1 */}
              <div className="ui-panel-inset space-y-1.5">
                <h3 className="text-sm font-semibold">1. Add media</h3>
                <p className="text-[13px] text-[var(--ui-muted)] leading-relaxed">
                  Upload an image or video, or pick a preset.
                </p>
              </div>

              {/* Step 2 */}
              <div className="ui-panel-inset space-y-1.5">
                <h3 className="text-sm font-semibold">2. Write the caption</h3>
                <p className="text-[13px] text-[var(--ui-muted)] leading-relaxed">
                  Enter a topic and generate a caption.
                </p>
              </div>

              {/* Step 3 */}
              <div className="ui-panel-inset space-y-1.5">
                <h3 className="text-sm font-semibold">3. Publish</h3>
                <p className="text-[13px] text-[var(--ui-muted)] leading-relaxed">
                  Preview, then schedule or publish to the selected channels.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'studio' && (
          <div className="ui-view grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: STEP 1 (Media Hub) + STEP 2 (Caption studio) */}
            <div className="lg:col-span-7 space-y-6">
              {/* STEP 1: Media Hub Card */}
              <div className="ui-panel space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="ui-panel-title">1. Media</h2>
                    <p className="ui-sub">Upload or pick a preset</p>
                  </div>

                  <div onClickCapture={(event) => {
                    const option = event.target.closest('label')?.querySelector('input');
                    if (option?.value === 'upload') {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}>
                    <Segmented
                      name="media-source"
                      label="Media source"
                      value={mediaSourceType}
                      options={[{ value: 'sample', label: 'Presets' }, { value: 'upload', label: 'Upload', icon: Upload }]}
                      onChange={(value) => value === 'sample' ? setMediaSourceType('sample') : fileInputRef.current?.click()}
                    />
                  </div>
                </div>

                {/* Upload & Preset Options */}
                {mediaSourceType === 'sample' && (
                  <div className="space-y-2">
                    <p className="ui-label">Presets</p>
                    <div className="grid grid-cols-3 gap-3">
                      {SAMPLE_IN2PETA_MEDIA.map((item, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => {
                            setAttachedMediaUrl(item.url);
                            setAttachedMediaId(null);
                            setAttachedMediaType(item.type);
                          }}
                          className="ui-chip !p-0 relative overflow-hidden aspect-[4/3] w-full"
                          aria-pressed={attachedMediaUrl === item.url}
                          aria-label={`Use ${item.name} preset`}
                        >
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                          <span className="absolute start-1 end-1 [inset-block-end:0.25rem] bg-[var(--ui-surface)] rounded-md px-2 py-1 text-[13px] truncate">{item.name}</span>
                          {attachedMediaUrl === item.url && (
                            <Check className="absolute end-2 [inset-block-start:0.5rem] w-5 h-5 text-[var(--ui-ink)] bg-[var(--ui-accent)] rounded-full p-1" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* File upload */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="ui-btn ui-btn-ghost ui-btn-block !h-auto ui-panel-inset flex flex-col items-center gap-2 py-5"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--ui-raised)] flex items-center justify-center transition-colors">
                    {isUploading ? (
                      <RefreshCw className="w-5 h-5 text-[var(--ui-lavender)] ui-spin" />
                    ) : (
                      <CloudUpload className="w-5 h-5 text-[var(--ui-muted)]" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[var(--ui-ink)]">
                      {isUploading ? 'Uploading…' : 'Choose an image or video'}
                    </p>
                    <p className="text-[13px] text-[var(--ui-faint)]">Supports JPG, PNG, WEBP, MP4 & MOV</p>
                  </div>
                </button>

                {/* Direct URL Input */}
                <form onSubmit={handlePasteUrlSubmit} className="flex gap-2">
                  <input
                    type="url"
                    aria-label="Image or video URL"
                    placeholder="Paste an image or video URL"
                    value={pastedUrlInput}
                    onChange={(e) => setPastedUrlInput(e.target.value)}
                    className="ui-input"
                  />
                  <button
                    type="submit"
                    className="ui-btn ui-btn-ghost"
                  >
                    Attach
                  </button>
                </form>
              </div>

              {/* STEP 2: AI Caption Generator Card */}
              <div className="ui-panel space-y-5">
                <div>
                  <h2 className="ui-panel-title">2. Caption studio</h2>
                  <p className="ui-sub">Draft a caption for your selected channels</p>
                </div>

                {/* Inspiration Idea Chips */}
                <div className="space-y-2">
                  <p className="ui-label">Ideas</p>
                  <div className="flex flex-wrap gap-2">
                    {INSPIRATION_CHIPS.map((chip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setTopic(chip);
                          handleGenerateCaption(chip);
                        }}
                        className="ui-chip whitespace-normal py-2"
                        aria-pressed={topic === chip}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topic Input Field */}
                <div className="space-y-1.5">
                  <label htmlFor="post-topic" className="ui-label">Topic</label>
                  <textarea
                    id="post-topic"
                    rows={3}
                    placeholder="What is this post about? (e.g. 20% off summer HVAC service, energy saving tips, product showcase)"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="ui-textarea resize-none"
                  />
                </div>

                {/* Target Channels Multi-Selector (All 7 Supported Platforms) */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="ui-label !mb-0">
                      <span>Publishing channels </span>
                      <span className="text-[13px] font-normal text-[var(--ui-muted)]">
                        ({selectedPlatforms.length} / {ALL_PLATFORMS.length} selected)
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedPlatforms.length === ALL_PLATFORMS.length) {
                          setSelectedPlatforms(['instagram', 'facebook']);
                        } else {
                          setSelectedPlatforms(ALL_PLATFORMS.map((p) => p.id));
                        }
                      }}
                      className="ui-link text-[13px]"
                    >
                      {selectedPlatforms.length === ALL_PLATFORMS.length ? 'Reset to Meta' : 'Select all channels'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ALL_PLATFORMS.map((plat) => {
                      const Icon = plat.icon;
                      const isSelected = selectedPlatforms.includes(plat.id);
                      return (
                        <button
                          key={plat.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              if (selectedPlatforms.length > 1) {
                                setSelectedPlatforms(selectedPlatforms.filter((p) => p !== plat.id));
                              } else {
                                showToast('Keep at least 1 platform selected.', 'info');
                              }
                            } else {
                              setSelectedPlatforms([...selectedPlatforms, plat.id]);
                            }
                          }}
                          className="ui-chip min-w-0"
                          aria-pressed={isSelected}
                        >
                          <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                            <Icon className="w-3.5 h-3.5" style={{ color: plat.color }} />
                          </div>
                          <span className="truncate">{plat.name}</span>
                          {isSelected && <Check className="w-3 h-3 ml-auto shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tone & CTA Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="post-tone" className="ui-label">Tone of voice</label>
                    <select
                    id="post-tone"
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="ui-select"
                    >
                      <option value="Warm & Engaging">Warm and engaging</option>
                      <option value="High-Energy & Promotional">Energetic and promotional</option>
                      <option value="Luxury & Exclusive">Luxury and exclusive</option>
                      <option value="Informative & Educational">Informative and educational</option>
                      <option value="Playful & Humorous">Playful and humorous</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="post-cta" className="ui-label">Call to action</label>
                    <input
                    id="post-cta"
                      type="text"
                      value={callToAction}
                      onChange={(e) => setCallToAction(e.target.value)}
                      className="ui-input"
                    />
                  </div>
                </div>

                {/* Generate caption */}
                <button
                  type="button"
                  onClick={() => handleGenerateCaption()}
                  disabled={isGenerating}
                  className="ui-btn ui-btn-light ui-btn-lg ui-btn-block"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 ui-spin" />
                      <span>Generating…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate caption</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Live Instagram / Facebook Simulator & Publishing Controls */}
            <div className="lg:col-span-5 space-y-6">
              {/* Instagram iPhone Simulator Card */}
              <div className="ui-panel space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="ui-panel-title">3. Channel preview</h2>
                  <Segmented name="aspect-ratio" label="Preview aspect ratio" value={aspectRatio} onChange={setAspectRatio} options={[
                    { value: 'square', label: '1:1' },
                    { value: 'portrait', label: '4:5' },
                    { value: 'reel', label: '9:16' },
                  ]} />
                </div>

                {/* Multi-Platform Preview Selector Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {ALL_PLATFORMS.map((plat) => {
                    const Icon = plat.icon;
                    const isActive = activePreviewPlatform === plat.id;
                    const isTarget = selectedPlatforms.includes(plat.id);
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => setActivePreviewPlatform(plat.id)}
                        className="ui-tab"
                        aria-selected={isActive}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color: plat.color }} />
                        <span>{plat.name.split(' ')[0]}</span>
                        {isTarget && <span className="ui-dot text-[var(--ui-good)]" aria-label="Selected for publishing" />}
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Multi-Platform Preview Mockup */}
                <div className="ui-panel-inset overflow-hidden max-w-[370px] mx-auto text-left !p-0">
                  {/* FACEBOOK MOCKUP */}
                  {activePreviewPlatform === 'facebook' && (
                    <div className="p-4 space-y-3 bg-[var(--ui-bg)] text-[var(--ui-ink)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={activeChannel?.avatar || SAMPLE_IN2PETA_MEDIA[0].url}
                            alt="Facebook avatar"
                            className="w-9 h-9 rounded-full object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-[13px] font-bold text-[var(--ui-ink)]">{activeChannel?.name || 'Mytestpage'}</span>
                              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ui-muted)]" />
                            </div>
                            <span className="text-[13px] text-[var(--ui-muted)]">Just now</span>
                          </div>
                        </div>
                        <MoreHorizontal className="w-4 h-4 text-[var(--ui-muted)]" />
                      </div>

                      {/* Hook & Caption */}
                      <div className="text-sm space-y-1.5">
                        {editHook && <p className="font-bold text-[var(--ui-ink)]">{editHook}</p>}
                        <p className="text-[var(--ui-muted)] text-sm leading-relaxed whitespace-pre-line line-clamp-3">
                          {editCaption || 'Your generated post caption will appear here.'}
                        </p>
                        {editHashtags && <p className="text-[var(--ui-lavender)] text-[13px]">{editHashtags}</p>}
                      </div>

                      {/* Media */}
                      <div className="rounded-lg overflow-hidden aspect-[16/9] bg-[var(--ui-bg)]">
                        {attachedMediaType === 'video' ? (
                          <video src={attachedMediaUrl} controls autoPlay loop muted className="w-full h-full object-cover" />
                        ) : (
                          <img src={attachedMediaUrl} alt="Facebook media" className="w-full h-full object-cover" />
                        )}
                      </div>

                      {/* Facebook Reaction Bar */}
                      <div className="pt-2 flex items-center justify-around text-[var(--ui-muted)] text-[13px] font-semibold">
                        <div className="flex items-center gap-1.5">
                          <ThumbsUp className="w-4 h-4" /> <span>Like</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MessageCircle className="w-4 h-4" /> <span>Comment</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Share2 className="w-4 h-4" /> <span>Share</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LINKEDIN MOCKUP */}
                  {activePreviewPlatform === 'linkedin' && (
                    <div className="p-4 space-y-3 bg-[var(--ui-bg)] text-[var(--ui-ink)]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={activeChannel?.avatar || SAMPLE_IN2PETA_MEDIA[0].url}
                            alt="LinkedIn avatar"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <span className="text-[13px] font-bold text-[var(--ui-ink)] block">In2Peta Growthcrew</span>
                            <span className="text-[13px] text-[var(--ui-muted)] block truncate max-w-[190px]">
                              AI Automation & Growth Specialist • 1st
                            </span>
                            <span className="text-[13px] text-[var(--ui-faint)]">1m · Edited</span>
                          </div>
                        </div>
                        <span className="text-[13px] text-[var(--ui-lavender)] font-bold cursor-pointer">+ Follow</span>
                      </div>

                      <div className="text-sm space-y-1.5">
                        {editHook && <p className="font-bold text-[var(--ui-ink)]">{editHook}</p>}
                        <p className="text-[var(--ui-muted)] text-sm leading-relaxed whitespace-pre-line line-clamp-3">
                          {editCaption || 'Your professional business post caption will appear here.'}
                        </p>
                        {editHashtags && <p className="text-[var(--ui-lavender)] text-[13px]">{editHashtags}</p>}
                      </div>

                      <div className="rounded-lg overflow-hidden aspect-[16/9] bg-[var(--ui-bg)]">
                        <img src={attachedMediaUrl} alt="LinkedIn media" className="w-full h-full object-cover" />
                      </div>

                      <div className="pt-2 flex items-center justify-between text-[var(--ui-muted)] text-[13px] font-semibold px-2">
                        <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4" /> Like</span>
                        <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> Comment</span>
                        <span className="flex items-center gap-1"><Repeat2 className="w-4 h-4" /> Repost</span>
                        <span className="flex items-center gap-1"><Send className="w-4 h-4" /> Send</span>
                      </div>
                    </div>
                  )}

                  {/* X / TWITTER MOCKUP */}
                  {activePreviewPlatform === 'x' && (
                    <div className="p-4 space-y-3 bg-[var(--ui-bg)] text-[var(--ui-ink)]">
                      <div className="flex items-start gap-3">
                        <img
                          src={activeChannel?.avatar || SAMPLE_IN2PETA_MEDIA[0].url}
                          alt="X avatar"
                          className="w-9 h-9 rounded-full object-cover"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-bold text-[var(--ui-ink)]">{activeChannel?.name || 'Mytestpage'}</span>
                            <span className="text-[13px] text-[var(--ui-faint)]">@mytestpage · 1m</span>
                          </div>

                          <div className="text-sm space-y-1">
                            {editHook && <p className="font-semibold text-[var(--ui-ink)]">{editHook}</p>}
                            <p className="text-[var(--ui-ink)] text-sm leading-relaxed whitespace-pre-line line-clamp-4">
                              {editCaption || 'Your tweet text will appear here.'}
                            </p>
                            {editHashtags && <p className="text-[var(--ui-lavender)] text-[13px]">{editHashtags}</p>}
                          </div>

                          <div className="rounded-lg overflow-hidden aspect-[16/9] bg-[var(--ui-bg)]">
                            <img src={attachedMediaUrl} alt="X media" className="w-full h-full object-cover" />
                          </div>

                          <div className="flex items-center justify-between text-[var(--ui-faint)] text-[13px] pt-1 px-1">
                            <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> 24</span>
                            <span className="flex items-center gap-1"><Repeat2 className="w-4 h-4" /> 12</span>
                            <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> 98</span>
                            <span className="flex items-center gap-1"><BarChart3 className="w-4 h-4" /> 1.4K</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* REDDIT MOCKUP */}
                  {activePreviewPlatform === 'reddit' && (
                    <div className="p-4 space-y-2.5 bg-[var(--ui-bg)] text-[var(--ui-ink)]">
                      <div className="flex items-center gap-2 text-[13px] text-[var(--ui-muted)]">
                        <span className="font-bold text-[var(--ui-ink)]">r/GrowthHacking</span>
                        <span>•</span>
                        <span>Posted by u/aarya 2m ago</span>
                      </div>
                      <h4 className="text-sm font-semibold leading-snug">
                        {editHook || topic || 'Exciting update on our growth stack!'}
                      </h4>
                      <p className="text-sm text-[var(--ui-muted)] leading-relaxed line-clamp-3">
                        {editCaption || 'Community post discussion body.'}
                      </p>
                      <div className="rounded-lg overflow-hidden aspect-[16/9] bg-[var(--ui-bg)]">
                        <img src={attachedMediaUrl} alt="Reddit media" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex items-center gap-4 text-[13px] font-bold text-[var(--ui-muted)] pt-1">
                        <div className="flex items-center gap-1.5 ui-badge">
                          <ArrowBigUp className="w-4 h-4" /> <span>42</span> <ArrowBigDown className="w-4 h-4" />
                        </div>
                        <div className="flex items-center gap-1 ui-badge">
                          <MessageCircle className="w-4 h-4" /> <span>18 comments</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* YOUTUBE COMMUNITY MOCKUP */}
                  {activePreviewPlatform === 'youtube' && (
                    <div className="p-4 space-y-3 bg-[var(--ui-bg)] text-[var(--ui-ink)]">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={activeChannel?.avatar || SAMPLE_IN2PETA_MEDIA[0].url}
                          alt="YouTube avatar"
                          className="w-9 h-9 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-[13px] font-bold text-[var(--ui-ink)]">GrowthCrew Official</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ui-muted)]" />
                          </div>
                          <span className="text-[13px] text-[var(--ui-faint)]">12 minutes ago</span>
                        </div>
                      </div>

                      <p className="text-[13px] text-[var(--ui-ink)] leading-relaxed whitespace-pre-line line-clamp-3">
                        {editHook ? `${editHook}\n\n` : ''}
                        {editCaption || 'YouTube Community update post.'}
                      </p>

                      <div className="rounded-lg overflow-hidden aspect-[16/9] bg-[var(--ui-bg)]">
                        <img src={attachedMediaUrl} alt="YouTube community" className="w-full h-full object-cover" />
                      </div>

                      <div className="flex items-center gap-4 text-[13px] text-[var(--ui-muted)] pt-1">
                        <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4" /> 156</span>
                        <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> 32</span>
                      </div>
                    </div>
                  )}

                  {/* DISCORD WEBHOOK MOCKUP */}
                  {activePreviewPlatform === 'discord' && (
                    <div className="p-4 space-y-2 bg-[var(--ui-bg)] text-[var(--ui-ink)]">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[var(--ui-bg)] flex items-center justify-center font-bold text-[var(--ui-ink)] text-[13px]">
                          GC
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-bold text-[var(--ui-ink)]">GrowthCrew Bot</span>
                            <span className="ui-badge">
                              App
                            </span>
                          </div>
                          <span className="text-[13px] text-[var(--ui-muted)]">Today at 12:00 PM</span>
                        </div>
                      </div>

                      {/* Discord Embed */}
                      <div className="ui-panel-raised space-y-2">
                        <span className="text-[13px] font-bold text-[var(--ui-lavender)] block">GrowthCrew post</span>
                        <h4 className="text-[13px] font-bold text-[var(--ui-ink)]">{editHook || topic || 'New community post'}</h4>
                        <p className="text-sm text-[var(--ui-muted)] whitespace-pre-line line-clamp-3">
                          {editCaption || 'Formatted rich embed dispatch for Discord subscribers.'}
                        </p>
                        <div className="rounded-lg overflow-hidden aspect-[16/9] bg-[var(--ui-bg)]">
                          <img src={attachedMediaUrl} alt="Discord embed media" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[13px] text-[var(--ui-faint)] block">GrowthCrew AI • Channel preview</span>
                      </div>
                    </div>
                  )}

                  {/* INSTAGRAM MOCKUP (DEFAULT) */}
                  {activePreviewPlatform === 'instagram' && (
                    <div className="bg-[var(--ui-bg)]">
                      {/* Phone Header / Profile Bar */}
                      <div className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full p-[1.5px] bg-[var(--ui-raised)]">
                            <img
                              src={activeChannel?.avatar || SAMPLE_IN2PETA_MEDIA[0].url}
                              alt="profile"
                              className="w-full h-full rounded-full object-cover bg-[var(--ui-bg)]"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-[13px] font-bold text-[var(--ui-ink)]">{activeChannel?.name || 'Mytestpage'}</span>
                              <CheckCircle2 className="w-3 h-3 text-[var(--ui-muted)]" />
                            </div>
                            <span className="text-[13px] text-[var(--ui-muted)]">{activeChannel?.handle || '@mytestpage'}</span>
                          </div>
                        </div>
                        <MoreHorizontal className="w-4 h-4 text-[var(--ui-muted)]" />
                      </div>

                      {/* Media Display */}
                      <div
                        className={`relative w-full bg-[var(--ui-bg)] overflow-hidden ${
                          aspectRatio === 'square'
                            ? 'aspect-square'
                            : aspectRatio === 'reel'
                            ? 'aspect-[9/16]'
                            : 'aspect-[4/5]'
                        }`}
                      >
                        {attachedMediaType === 'video' ? (
                          <video
                            src={attachedMediaUrl}
                            controls
                            autoPlay
                            loop
                            muted
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={attachedMediaUrl}
                            alt="Instagram preview"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      {/* Action Bar (Heart, Comment, Share, Bookmark) */}
                      <div className="p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3.5">
                            <Heart className="w-5 h-5 text-[var(--ui-muted)]" />
                            <MessageCircle className="w-5 h-5 text-[var(--ui-muted)]" />
                            <Share2 className="w-5 h-5 text-[var(--ui-muted)]" />
                          </div>
                          <Bookmark className="w-5 h-5 text-[var(--ui-muted)]" />
                        </div>

                        {/* Caption Preview */}
                        <div className="text-sm space-y-1.5">
                          {editHook && (
                            <p className="font-semibold text-[var(--ui-ink)] text-[13px] leading-snug">
                              {editHook}
                            </p>
                          )}

                          <p className={`text-[var(--ui-muted)] text-sm leading-relaxed whitespace-pre-line ${expandedCaption ? '' : 'line-clamp-3'}`}>
                            {editCaption || (
                              <span className="text-[var(--ui-faint)] italic">
                                Caption preview
                              </span>
                            )}
                          </p>

                          {editCaption && editCaption.length > 120 && (
                            <button
                              type="button"
                              onClick={() => setExpandedCaption(!expandedCaption)}
                              className="ui-link text-[13px]"
                            >
                              {expandedCaption ? 'Show less' : 'Show more'}
                            </button>
                          )}

                          {editHashtags && (
                            <p className="text-[13px] text-[var(--ui-lavender)] font-medium">
                              {editHashtags}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scheduling & Publish Actions */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--ui-lavender)]" />
                    <label htmlFor="post-date" className="ui-label">Schedule date and time</label>
                  </div>
                  <input
                    id="post-date"
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="ui-input"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleSchedulePost}
                      disabled={actionLoading === 'schedule'}
                      className="ui-btn ui-btn-ghost ui-btn-block"
                    >
                      <Clock className="w-3.5 h-3.5 text-[var(--ui-lavender)]" />
                      <span>Add to queue</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInstantPublish(generatedDraft?.id || 'new')}
                      disabled={actionLoading?.startsWith('pub_')}
                      className="ui-btn ui-btn-primary ui-btn-block"
                    >
                      <Send className="w-3.5 h-3.5 text-[var(--ui-ink)]" />
                      <span>Publish to {selectedPlatforms.length} channels</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REVIEW & SCHEDULED QUEUE */}
        {activeTab === 'queue' && (
          <div className="ui-view space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <div>
                <h2 className="ui-title flex flex-wrap items-center gap-2">
                  Review & scheduled queue
                  <span className="ui-badge">
                    {queueList.length} total
                  </span>
                </h2>
                <p className="text-[13px] text-[var(--ui-muted)]">Pending and scheduled posts</p>
              </div>

              {/* Filter Tabs */}
              <div className="max-w-full overflow-x-auto">
                <Segmented name="queue-filter" label="Queue status filter" value={queueFilter} onChange={setQueueFilter} options={[
                  { value: 'ALL', label: 'All' },
                  { value: 'PENDING_REVIEW', label: 'Review' },
                  { value: 'SCHEDULED', label: 'Scheduled' },
                  { value: 'PUBLISHED', label: 'Published' },
                ]} />
              </div>
            </div>

            {/* Queue List */}
            {filteredQueue.length === 0 ? (
              <div className="ui-panel text-center space-y-3 py-12">
                <Layers className="w-8 h-8 text-[var(--ui-faint)] mx-auto" />
                <h3 className="font-bold text-sm text-[var(--ui-ink)]">No posts in this view</h3>
                <p className="text-[13px] text-[var(--ui-muted)] max-w-sm mx-auto">
                  Create a post in the studio to add it to your queue.
                </p>
                <button
                  onClick={() => setActiveTab('studio')}
                  className="ui-btn ui-btn-primary"
                >
                  Go to studio
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQueue.map((post) => (
                  <div
                    key={post.id}
                    className="ui-panel flex flex-col justify-between space-y-4 ui-arrive"
                  >
                    <div className="space-y-3">
                      {/* Post Status & Scheduled Date */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`ui-badge ${
                            post.status === 'PUBLISHED'
                              ? 'ui-badge-good'
                              : post.status === 'PENDING_REVIEW'
                              ? 'ui-badge-warn'
                              : ''
                          }`}
                        >
                          {post.status === 'PENDING_REVIEW' ? 'Review required' : post.status === 'PUBLISHED' ? 'Published' : post.status === 'SCHEDULED' ? 'Scheduled' : post.status}
                        </span>

                        <span className="text-[13px] text-[var(--ui-muted)] flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[var(--ui-faint)]" />
                          {new Date(post.scheduledDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Attached Media Thumbnail */}
                      {post.mediaUrl && (
                        <div className="rounded-lg overflow-hidden aspect-video bg-[var(--ui-bg)] relative">
                          <img src={post.mediaUrl} alt="post asset" className="w-full h-full object-cover" />
                          <span className="ui-badge absolute [inset-block-start:0.5rem] start-2">
                            {post.mediaType === 'video' ? 'Video' : 'Image'}
                          </span>
                        </div>
                      )}

                      {/* Hook & Caption */}
                      <div>
                        {post.hook && (
                          <p className="font-semibold text-sm text-[var(--ui-ink)] line-clamp-1 mb-1">
                            {post.hook}
                          </p>
                        )}
                        <p className="text-sm text-[var(--ui-muted)] line-clamp-3 leading-relaxed">
                          {post.caption}
                        </p>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingPost(post)}
                          className="ui-btn ui-btn-ghost ui-btn-icon ui-btn-sm"
                          title="Edit Post"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="ui-btn ui-btn-danger ui-btn-icon ui-btn-sm"
                          title="Delete Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {post.status === 'PENDING_REVIEW' && (
                          <button
                            onClick={() => handleApprovePost(post.id)}
                            className="ui-btn ui-btn-ghost ui-btn-sm"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleInstantPublish(post.id)}
                          className="ui-btn ui-btn-light ui-btn-sm"
                        >
                          Publish now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PUBLISHED HISTORY */}
        {activeTab === 'history' && (() => {
          const allPublished = (publishedPosts && publishedPosts.length > 0)
            ? publishedPosts
            : (queueData.queue || []).filter((p) => p.status === 'PUBLISHED');

          return (
            <div className="ui-view space-y-6">
              <div className="pb-2 flex items-center justify-between">
                <div>
                  <h2 className="ui-title flex flex-wrap items-center gap-2">
                    Published posts
                    <span className="ui-badge ui-badge-good">
                      {allPublished.length} published
                    </span>
                  </h2>
                  <p className="text-[13px] text-[var(--ui-muted)]">Posts that went live</p>
                </div>
                <a
                  href="https://facebook.com/profile.php?id=61594485176950&sk=photos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ui-btn ui-btn-ghost hidden sm:inline-flex"
                >
                  <FacebookIcon className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Open Facebook photos</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {allPublished.length === 0 ? (
                <div className="ui-panel text-center space-y-3 py-12">
                  <CheckCircle2 className="w-8 h-8 text-[var(--ui-faint)] mx-auto" />
                  <h3 className="font-bold text-sm text-[var(--ui-ink)]">No published posts yet</h3>
                  <p className="text-[13px] text-[var(--ui-muted)] max-w-sm mx-auto">
                    Published posts will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allPublished.map((post, idx) => {
                    const postImg = post.visualUrl || post.mediaUrl;
                    const postText = post.fullPostText || post.caption || post.content || '';
                    const postDate = post.publishedAt || post.publishDate || post.createdAt || Date.now();

                    return (
                      <div
                        key={post.id || idx}
                        className="ui-panel flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="ui-badge ui-badge-good flex items-center gap-1">
                              <span className="ui-dot" />
                              Published
                            </span>
                            <span className="text-[13px] text-[var(--ui-muted)]">
                              {new Date(postDate).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {postImg && (
                            <div className="rounded-lg overflow-hidden aspect-video bg-[var(--ui-bg)] relative group">
                              <img src={postImg} alt="media" className="w-full h-full object-cover" />
                              <div className="absolute top-2 right-2 flex gap-1">
                                {(post.platforms || ['facebook']).map((p, i) => (
                                  <span key={i} className="ui-badge">
                                    {p === 'facebook' ? (
                                      <FacebookIcon className="w-3 h-3 text-[#38BDF8]" />
                                    ) : (
                                      <InstagramIcon className="w-3 h-3 text-[var(--ui-lavender)]" />
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            {post.topic && (
                              <h4 className="text-sm font-semibold line-clamp-1">{post.topic}</h4>
                            )}
                            <div
                              className="text-sm text-[var(--ui-muted)] leading-relaxed line-clamp-4 whitespace-pre-line"
                              dangerouslySetInnerHTML={{ __html: postText.replace(/\n/g, '<br/>') }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
                          <span className="ui-badge ui-badge-good flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Published
                          </span>
                          <a
                            href="https://facebook.com/profile.php?id=61594485176950&sk=photos"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ui-btn ui-btn-ghost ui-btn-sm"
                          >
                            <span>View Facebook photos</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </main>

      {/* Connect / Switch Channel Modal (Instagram & Facebook) */}
      {showConnectModal && (
        <div className="ui-scrim">
          <div role="dialog" aria-modal="true" aria-labelledby="channel-dialog-title" className="ui-dialog max-w-md space-y-5">
            <div className="flex items-center justify-between pb-3">
              <h2 id="channel-dialog-title" className="ui-panel-title">Select a channel</h2>
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="ui-btn ui-btn-ghost ui-btn-icon ui-btn-sm"
                aria-label="Close channel dialog"
              >
                <X aria-hidden="true" />
              </button>
            </div>

            {/* Available Channels List */}
            <div className="space-y-2">
              <p className="ui-label">Connected channels</p>
              <div className="space-y-2">
                {channels.map((chan) => (
                  <button
                    type="button"
                    key={chan.id}
                    onClick={() => {
                      setActiveChannel(chan);
                      setShowConnectModal(false);
                      showToast(`Active channel set to ${chan.name}!`, 'success');
                    }}
                    className="ui-chip w-full justify-between !h-auto !py-2"
                    aria-pressed={activeChannel?.id === chan.id}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full">
                        <img src={chan.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                      </div>
                      <div>
                        <span className="text-[13px] font-bold text-[var(--ui-ink)] block">{chan.name}</span>
                        <span className="text-[13px] text-[var(--ui-muted)] flex items-center gap-1.5">
                          {chan.platform === 'facebook' ? (
                            <FacebookIcon className="w-3 h-3 text-[#38BDF8]" />
                          ) : (
                            <InstagramIcon className="w-3 h-3 text-[var(--ui-lavender)]" />
                          )}
                          <span>{chan.handle}</span>
                        </span>
                      </div>
                    </div>
                    {activeChannel?.id === chan.id && (
                      <CheckCircle2 className="w-4 h-4 text-[var(--ui-lavender)]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 1-Click Meta OAuth Connect Button */}
            <div className="pt-2">
              <a
                href={`${API_BASE}/api/auth/meta/login`}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#1877F2] via-[#E1306C] to-[#FD1D1D] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-xl shadow-[#1877F2]/25 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border border-white/20"
              >
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
                <span>1-Click Connect with Facebook & Instagram</span>
              </a>
              <p className="text-[10px] text-slate-400 text-center mt-2 leading-relaxed">
                Connects your Instagram Business feed and Facebook Page directly via Meta OAuth (no manual tokens needed).
              </p>
            </div>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-white/[0.08] w-full" />
              <span className="bg-[#0e1118] px-3 text-[10px] text-slate-500 uppercase tracking-widest font-semibold absolute">
                Or Manual Developer Credentials
              </span>
            </div>

            {/* Add Custom Handle & Credentials */}
            <form onSubmit={handleConnectInstagram} className="space-y-3 pt-3">
              <h3 className="ui-panel-title">Connect a channel</h3>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="connect-platform" className="ui-label">Platform</label>
                  <select
                    id="connect-platform"
                    value={customPlatform}
                    onChange={(e) => setCustomPlatform(e.target.value)}
                    className="ui-select"
                  >
                    {ALL_PLATFORMS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="connect-handle" className="ui-label">Username or handle</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-[var(--ui-faint)] text-[13px]">@</span>
                    <input
                      id="connect-handle"
                      type="text"
                      placeholder="handle_or_name"
                      value={customHandleInput}
                      onChange={(e) => setCustomHandleInput(e.target.value)}
                      className="ui-input !ps-7"
                    />
                  </div>
                </div>
              </div>

              {(customPlatform === 'facebook' || customPlatform === 'instagram') && (
                <div className="ui-panel-raised space-y-2">
                  <p className="ui-label">Meta Graph API credentials (optional)</p>
                  <div>
                    <input
                      type="text"
                      aria-label="Facebook Page ID"
                      placeholder="Facebook Page ID"
                      value={customFbPageId}
                      onChange={(e) => setCustomFbPageId(e.target.value)}
                      className="ui-input"
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      aria-label="Meta Page access token"
                      placeholder="Meta Page access token"
                      value={customFbToken}
                      onChange={(e) => setCustomFbToken(e.target.value)}
                      className="ui-input"
                    />
                  </div>
                  <p className="text-[13px] text-[var(--ui-faint)]">
                    Leave blank to use pre-configured system token, or paste your own Page ID & Token.
                  </p>
                </div>
              )}

              {customPlatform === 'discord' && (
                <div className="ui-panel-raised space-y-1.5">
                  <label htmlFor="discord-webhook" className="ui-label">Discord channel webhook URL</label>
                  <input
                    id="discord-webhook"
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={customDiscordWebhook}
                    onChange={(e) => setCustomDiscordWebhook(e.target.value)}
                    className="ui-input"
                  />
                  <p className="text-[13px] text-[var(--ui-faint)]">
                    Uses the webhook URL you provide for this channel.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="ui-btn ui-btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ui-btn ui-btn-primary"
                >
                  Save channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="ui-scrim">
          <div role="dialog" aria-modal="true" aria-labelledby="edit-dialog-title" className="ui-dialog max-w-lg space-y-4">
            <div className="flex items-center justify-between pb-3">
              <h2 id="edit-dialog-title" className="ui-panel-title flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[var(--ui-lavender)]" />
                Edit post
              </h2>
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="ui-btn ui-btn-ghost ui-btn-icon ui-btn-sm"
                aria-label="Close edit dialog"
              >
                <X aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label htmlFor="edit-hook" className="ui-label">Hook</label>
                <input
                  id="edit-hook"
                  type="text"
                  value={editingPost.hook || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, hook: e.target.value })}
                  className="ui-input"
                />
              </div>

              <div>
                <label htmlFor="edit-caption" className="ui-label">Caption</label>
                <textarea
                  id="edit-caption"
                  rows={4}
                  value={editingPost.caption || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, caption: e.target.value })}
                  className="ui-textarea resize-none"
                />
              </div>

              <div>
                <label htmlFor="edit-date" className="ui-label">Scheduled date and time</label>
                <input
                  id="edit-date"
                  type="datetime-local"
                  value={new Date(editingPost.scheduledDate).toISOString().slice(0, 16)}
                  onChange={(e) => setEditingPost({ ...editingPost, scheduledDate: new Date(e.target.value).toISOString() })}
                  className="ui-input"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="ui-btn ui-btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="ui-btn ui-btn-primary"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Platform Broadcast Result Modal */}
      {broadcastModalData && (
        <div className="ui-scrim">
          <div role="dialog" aria-modal="true" aria-labelledby="results-dialog-title" className="ui-dialog max-w-lg space-y-4">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <div>
                  <h2 id="results-dialog-title" className="ui-panel-title">Publishing results</h2>
                  <p className="text-[13px] text-[var(--ui-muted)]">Results for the channels you selected</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastModalData(null)}
                className="ui-btn ui-btn-ghost ui-btn-icon ui-btn-sm"
                aria-label="Close results dialog"
              >
                <X aria-hidden="true" />
              </button>
            </div>

            <div className="ui-panel-raised space-y-2">
              <div className="flex items-center justify-between text-[13px] font-bold">
                <span>Channel status</span>
                <span className="ui-badge">
                  {broadcastModalData.successCount || Object.keys(broadcastModalData.platforms || {}).length} /{' '}
                  {broadcastModalData.totalTargets || Object.keys(broadcastModalData.platforms || {}).length} channels
                </span>
              </div>
              <p className="text-[13px] text-[var(--ui-muted)]">{broadcastModalData.summary}</p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {Object.entries(broadcastModalData.platforms || {}).map(([platKey, res]) => {
                const platMeta = ALL_PLATFORMS.find((p) => p.id === platKey) || {
                  name: platKey,
                  color: '#fff',
                };
                return (
                  <div
                    key={platKey}
                    className="ui-panel-inset flex flex-wrap items-center justify-between gap-3 text-[13px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-semibold text-[var(--ui-ink)]">{platMeta.name}</span>
                      {res.status === 'published' || res.status === 'dispatched' ? (
                        <span className="ui-badge ui-badge-good">
                          {res.status === 'published' ? 'Published' : 'Dispatched'}
                        </span>
                      ) : (
                        <span className={`ui-badge capitalize ${res.status === 'failed' || res.status === 'error' ? 'ui-badge-bad' : 'ui-badge-warn'}`}>
                          {res.status?.replaceAll('_', ' ')}
                        </span>
                      )}
                    </div>
                    <div className="ui-hint min-w-0 break-all text-end">
                      {res.id ? `ID: ${res.id}` : res.message || 'Queued for channel'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBroadcastModalData(null)}
                className="ui-btn ui-btn-primary ui-btn-block"
              >
                Close and view published posts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Routing ─────────────────────────────────────────────────────
   The finder session is the signed-in state:
     landing  → sign-in → workspace
     ?signin=<code>&email=<email> → verify → review
     SaveStep (after a preview) → review, because the list is the next task
     ?autopilot=off → remembered, applied once signed in
   The workspace is the hub; Lead Gen, Social Studio and every coming-soon
   agent are one click from it. No route ever dead-ends. */

const AUTOPILOT_OFF_KEY = 'gc_finder_autopilot_off';

function readEntryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    signin: params.get('signin') || '',
    email: params.get('email') || '',
    autopilotOff: params.get('autopilot') === 'off',
  };
}

const userFromEmail = (email) => ({
  email,
  name: email.split('@')[0],
  initial: (email[0] || 'G').toUpperCase(),
});

function SigningIn() {
  return (
    <div className="fn-center" role="status">
      <Loader2 className="ui-spin" aria-hidden="true" />
      <p className="ui-sub">Signing you in…</p>
    </div>
  );
}

export default function App() {
  const [entry] = useState(readEntryParams);
  const [session, setSessionState] = useState(getSession);
  const [signedInAccount, setSignedInAccount] = useState(null);
  const [loginNotice, setLoginNotice] = useState('');
  const [autopilotOff, setAutopilotOff] = useState(
    () => entry.autopilotOff || localStorage.getItem(AUTOPILOT_OFF_KEY) === '1'
  );
  const [view, setView] = useState(() => {
    if (entry.signin && entry.email) return 'verifying';
    if (getSession()) return 'workspace';
    return entry.autopilotOff ? 'login' : 'landing';
  });
  const verifyStarted = useRef(false);

  // Strip one-time params from the address bar and remember the "turn off" request.
  useEffect(() => {
    if (entry.autopilotOff) localStorage.setItem(AUTOPILOT_OFF_KEY, '1');
    if (entry.signin || entry.email || entry.autopilotOff) {
      const url = new URL(window.location.href);
      ['signin', 'email', 'autopilot'].forEach((name) => url.searchParams.delete(name));
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, [entry]);

  // Sign-in link from the email. The code works once, so guard against a second run.
  useEffect(() => {
    if (!entry.signin || !entry.email || verifyStarted.current) return;
    verifyStarted.current = true;
    verifySignIn(entry.email, entry.signin)
      .then(({ account, token }) => {
        setSession(account?.email || entry.email, token);
        setSessionState(getSession());
        setSignedInAccount(account || null);
        setView('review');
      })
      .catch(() => {
        setLoginNotice('That sign-in link has expired or was already used. Enter your email and we will send a new one.');
        setView('login');
      });
  }, [entry]);

  const handleSignedIn = (account) => {
    setSessionState(getSession());
    setSignedInAccount(account || null);
    setLoginNotice('');
    setView('workspace');
  };

  // Signing in after keeping a preview should land on the list the person
  // just built, not on the hub. Everything else starts at the workspace.
  const handlePreviewSignedIn = (account) => {
    setSessionState(getSession());
    setSignedInAccount(account || null);
    setLoginNotice('');
    setView('review');
  };

  const handleSignOut = () => {
    clearSession();
    localStorage.removeItem('growthcrew_auth');
    setSessionState(null);
    setSignedInAccount(null);
    setView('landing');
  };

  // The finder token stopped working; back to the sign-in page.
  const handleSessionExpired = () => {
    clearSession();
    setSessionState(null);
    setSignedInAccount(null);
    setView('login');
  };

  const handleAutopilotHandled = () => {
    localStorage.removeItem(AUTOPILOT_OFF_KEY);
    setAutopilotOff(false);
  };

  // Module IDs are the app's navigation language. Live modules open their
  // working screen; coming-soon modules open an honest roadmap page.
  const handleNavigate = (id) => {
    if (id === 'workspace') setView('workspace');
    else if (id === 'leads') setView('review');
    else if (id === 'social') setView('social');
    else if (getModule(id)?.status === 'soon') setView(`soon:${id}`);
    else setView('workspace');
  };

  const currentUser = session ? userFromEmail(session.email) : null;

  // The session can disappear (cleared in another tab); never show an
  // account screen without one.
  const needsSession =
    view === 'review' || view === 'social' || view === 'workspace' || view.startsWith('soon:');
  const activeView = !session && needsSession ? 'login' : view;

  if (activeView === 'verifying') return <SigningIn />;

  if (activeView === 'login') {
    return (
      <LoginPage
        notice={loginNotice || (autopilotOff ? 'Sign in to turn off the weekly email.' : '')}
        onSignedIn={handleSignedIn}
        onBack={() => setView('landing')}
      />
    );
  }

  if (activeView === 'workspace') {
    return (
      <WorkspaceHome
        key={session.email}
        session={session}
        onNavigate={handleNavigate}
        onBackToSite={() => setView('landing')}
        onSignOut={handleSignOut}
        onSessionExpired={handleSessionExpired}
      />
    );
  }

  if (activeView.startsWith('soon:')) {
    return (
      <ComingSoon
        moduleId={activeView.slice('soon:'.length)}
        session={session}
        onNavigate={handleNavigate}
        onBackToSite={() => setView('landing')}
        onSignOut={handleSignOut}
      />
    );
  }

  if (activeView === 'review') {
    return (
      <ReviewScreen
        key={session.email}
        session={session}
        initialAccount={signedInAccount}
        turnAutopilotOff={autopilotOff}
        onAutopilotHandled={handleAutopilotHandled}
        onHome={() => setView('workspace')}
        onOpenSocial={() => setView('social')}
        onNavigate={handleNavigate}
        onSignOut={handleSignOut}
        onSessionExpired={handleSessionExpired}
      />
    );
  }

  if (activeView === 'social') {
    return (
      <SocialStudio
        currentUser={currentUser}
        onBack={() => setView('review')}
        onLogout={handleSignOut}
        onNavigate={handleNavigate}
      />
    );
  }

  return (
    <LandingPage
      onLoginClick={() => setView(session ? 'workspace' : 'login')}
      onSignedIn={handlePreviewSignedIn}
      onNavigate={handleNavigate}
    />
  );
}
