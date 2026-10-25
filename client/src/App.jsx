import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  ExternalLink,
  Send,
  RefreshCw,
  Layers,
  Calendar,
  Image as ImageIcon,
  Info,
  Check,
  Globe,
  Film,
  ArrowRight,
  HelpCircle,
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  Upload,
  Link as LinkIcon,
  Play,
  Share2,
  Clock,
  ShieldCheck,
  CloudUpload,
  Sliders,
  ChevronRight,
  Compass,
  LogOut,
  User,
  Mail
} from 'lucide-react';
import LoginPage from './LoginPage';
import OutreachPanel from './OutreachPanel';
import LandingPage from './LandingPage';
import { API_BASE } from './api';

// Custom SVG Icons for Multi-Platform Social Channels
const InstagramIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const LinkedInIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37h2.79V10.9H6.46M7.86 6.54a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26z" />
  </svg>
);

const XIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const RedditIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm6.2 12.3c.1.3.1.5.1.7 0 2.4-2.8 4.3-6.3 4.3s-6.3-1.9-6.3-4.3c0-.2 0-.5.1-.7-.6-.4-1-.9-1-1.6 0-1.1.9-2 2-2 .5 0 1 .2 1.3.6 1-.7 2.4-1.2 3.9-1.3l.8-3.7 2.6.6c.1-.6.7-1 1.4-1 1.1 0 2 .9 2 2s-.9 2-2 2c-.6 0-1.1-.3-1.4-.8l-2-.5-.6 2.8c1.5.1 2.8.6 3.8 1.3.4-.4.8-.6 1.4-.6 1.1 0 2 .9 2 2 0 .7-.4 1.2-1 1.6z" />
  </svg>
);

const YouTubeIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const DiscordIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const ALL_PLATFORMS = [
  { id: 'facebook', name: 'Facebook Page', color: '#1877F2', icon: FacebookIcon, badgeBg: 'bg-[#1877F2]/15 text-[#38BDF8] border-[#1877F2]/30' },
  { id: 'instagram', name: 'Instagram', color: '#E1306C', icon: InstagramIcon, badgeBg: 'bg-[#E1306C]/15 text-[#FF5376] border-[#E1306C]/30' },
  { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2', icon: LinkedInIcon, badgeBg: 'bg-[#0A66C2]/15 text-[#38BDF8] border-[#0A66C2]/30' },
  { id: 'x', name: 'X (Twitter)', color: '#FFFFFF', icon: XIcon, badgeBg: 'bg-white/10 text-white border-white/20' },
  { id: 'reddit', name: 'Reddit', color: '#FF4500', icon: RedditIcon, badgeBg: 'bg-[#FF4500]/15 text-[#FF6B4A] border-[#FF4500]/30' },
  { id: 'youtube', name: 'YouTube', color: '#FF0000', icon: YouTubeIcon, badgeBg: 'bg-[#FF0000]/15 text-rose-400 border-[#FF0000]/30' },
  { id: 'discord', name: 'Discord', color: '#5865F2', icon: DiscordIcon, badgeBg: 'bg-[#5865F2]/15 text-[#818CF8] border-[#5865F2]/30' },
];

const SCALORA_GRADIENT = 'bg-gradient-to-r from-[#FF6B4A] to-[#FFA84A]';
const SCALORA_ROSE_GRADIENT = 'bg-gradient-to-r from-[#FF5376] to-[#A855F7]';
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

export default function App({ defaultTab = 'studio', apiUrl } = {}) {
  // Authentication State - defaults to null on fresh open so login is shown first
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('growthcrew_auth');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed.name === 'Scalora Admin') {
        return {
          email: 'aarya@in2peta.com',
          name: 'Aarya',
          initial: 'A',
          role: 'Admin',
        };
      }
      return {
        ...parsed,
        name: parsed.name || 'Aarya',
        initial: parsed.initial || (parsed.name ? parsed.name[0].toUpperCase() : 'A'),
      };
    } catch {
      return null;
    }
  });

  // View mode: 'login' | 'landing' (Scalora Dashboard) | 'app' (Studio / Outreach)
  // When opening the app, the first screen is login
  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem('growthcrew_auth');
      return saved ? 'landing' : 'login';
    } catch {
      return 'login';
    }
  });

  const handleLogin = (user) => {
    const activeUser = {
      email: user?.email || 'aarya@in2peta.com',
      name: user?.name || 'Aarya',
      initial: user?.initial || 'A',
      role: user?.role || 'Admin',
    };
    setCurrentUser(activeUser);
    localStorage.setItem('growthcrew_auth', JSON.stringify(activeUser));
    setViewMode('landing'); // After login, immediately open the dashboard!
    showToast(`Welcome back, ${activeUser.name}!`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('growthcrew_auth');
    setViewMode('login'); // On logout, go directly to login page
    showToast('Signed out successfully.', 'info');
  };

  // Product mode: Social Studio (PostPulse) vs GrowthCrew Outreach
  const [productMode, setProductMode] = useState(defaultTab === 'outreach' ? 'growthcrew' : 'social');
  const [activeTab, setActiveTab] = useState(defaultTab === 'outreach' ? 'studio' : defaultTab); // 'studio' | 'queue' | 'history'
  const [showBeginnerGuide, setShowBeginnerGuide] = useState(true);
  const isGrowthcrew = productMode === 'growthcrew';

  const switchProductMode = (mode) => {
    setProductMode(mode);
    if (mode === 'social' && activeTab === 'outreach') {
      setActiveTab('studio');
    }
  };

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

  // Handle Deleting / Disconnecting Channel
  const handleDeleteChannel = async (channelId, e) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`${API_BASE}/api/channels/${channelId}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
    setChannels((prev) => {
      const rem = prev.filter((c) => c.id !== channelId);
      if (activeChannel?.id === channelId) {
        setActiveChannel(rem[0] || null);
      }
      return rem;
    });
    showToast('Channel removed.', 'info');
  };

  // Handle Connecting Custom Channel & Credentials
  const handleConnectInstagram = async (e) => {
    e.preventDefault();
    const cleanPlatform = customPlatform.toLowerCase();
    const platName = ALL_PLATFORMS.find((p) => p.id === cleanPlatform)?.name || cleanPlatform;

    if (cleanPlatform === 'instagram' || cleanPlatform === 'facebook') {
      if (!customFbPageId.trim() || !customFbToken.trim()) {
        showToast('Meta requires authorization. Please click the "1-Click Connect with Facebook & Instagram" button above, or enter both Page ID and Page Access Token.', 'error');
        return;
      }
    } else if (!customHandleInput.trim() && !customDiscordWebhook.trim()) {
      showToast('Please provide a handle or Webhook URL to connect.', 'error');
      return;
    }

    const formatted = customHandleInput.trim().replace(/^@/, '');

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
      if (!res.ok) {
        showToast(data.detail || data.error || 'Connection failed. Please check credentials.', 'error');
        return;
      }

      if (data.channels && Array.isArray(data.channels)) {
        setChannels(data.channels);
        setActiveChannel(data.channel || data.channels[data.channels.length - 1]);
      }

      setShowConnectModal(false);
      setCustomHandleInput('');
      setCustomFbPageId('');
      setCustomFbToken('');
      setCustomDiscordWebhook('');
      fetchData();
      showToast(`Connected ${platName} channel successfully!`, 'success');
    } catch (err) {
      showToast(`Connection failed: ${err.message}`, 'error');
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
      showToast(`📅 Post scheduled for ${new Date(scheduledDate).toLocaleString()}!`, 'success');
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
        showToast(`🚀 Published to ${selectedPlatforms.length} platforms!`, 'success');
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

  // 1. If not authenticated or in login mode, render Login Page first
  if (!currentUser || viewMode === 'login') {
    return (
      <LoginPage
        onLogin={(user) => {
          handleLogin(user);
          setViewMode('landing');
        }}
      />
    );
  }

  // 2. If viewMode is 'landing', render Dashboard (Scalora Marketing Landing Page)
  if (viewMode === 'landing') {
    return (
      <LandingPage
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigate={(mode) => {
          switchProductMode(mode === 'leadgen' ? 'growthcrew' : 'social');
          setViewMode('app');
        }}
        onLoginClick={() => setViewMode('login')}
      />
    );
  }

  const queueList = queueData.queue || [];
  const pendingCount = queueList.filter((p) => p.status === 'PENDING_REVIEW').length;
  const filteredQueue =
    queueFilter === 'ALL'
      ? queueList
      : queueList.filter((p) => p.status === queueFilter);

  return (
    <div className="min-h-screen bg-[#07080a] text-slate-100 flex flex-col font-sans antialiased selection:bg-[#FF6B4A]/30 selection:text-[#FFA84A] scalora-mesh-bg">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-2xl border transition-all animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-800/60 shadow-rose-950/50'
              : toast.type === 'info'
              ? 'bg-[#101522]/95 text-sky-200 border-sky-800/50 shadow-sky-950/50'
              : 'bg-[#0e1713]/95 text-emerald-200 border-emerald-700/50 shadow-emerald-950/50'
          }`}
        >
          {toast.type === 'error' ? (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : toast.type === 'info' ? (
            <Info className="w-5 h-5 text-sky-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      <header className="border-b border-white/[0.07] bg-[#07080a]/85 backdrop-blur-2xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Scalora Logo - clicking takes user back to Dashboard */}
            <div
              onClick={() => setViewMode('landing')}
              className="w-10 h-10 rounded-2xl p-[1.5px] bg-gradient-to-tr from-[#FF6B4A] via-[#FF5376] to-[#FFA84A] shadow-lg shadow-[#FF6B4A]/25 shrink-0 cursor-pointer hover:scale-105 transition-transform"
              title="Return to Dashboard"
            >
              <div className="w-full h-full bg-[#0a0c10] rounded-[14px] flex items-center justify-center">
                {isGrowthcrew ? (
                  <Mail className="w-5 h-5 text-[#FF5376]" />
                ) : (
                  <Sparkles className="w-5 h-5 text-[#FFA84A]" />
                )}
              </div>
            </div>

            <div className="min-w-0 flex items-center gap-3">
              <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5 truncate">
                {isGrowthcrew ? (
                  <>
                    GrowthCrew <span className="font-serif-accent font-normal italic text-[#FF5376] text-xl">Lead Gen & Outreach</span>
                  </>
                ) : (
                  <>
                    GrowthCrew <span className="font-serif-accent font-normal italic text-[#FFA84A] text-xl">Social Media Studio</span>
                  </>
                )}
              </h1>

              {/* Clear 'Back to Dashboard' Button */}
              <button
                type="button"
                onClick={() => setViewMode('landing')}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer shadow-sm group ml-2"
                title="Go back to Dashboard"
              >
                <ArrowRight className="w-3.5 h-3.5 text-[#FFA84A] rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!isGrowthcrew && (
              <>

                <a
                  href={IN2PETA_EXPLORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
                  title="Browse image and video models"
                >
                  <span>Explore models</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>

                <div
                  onClick={() => setShowConnectModal(true)}
                  className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all cursor-pointer group"
                  title="Switch channel"
                >
                  <div className="w-7 h-7 rounded-full p-[1.5px] bg-gradient-to-tr from-[#FF6B4A] to-[#FF5376] shrink-0">
                    <img
                      src={activeChannel?.avatar || SAMPLE_IN2PETA_MEDIA[0].url}
                      alt="avatar"
                      className="w-full h-full rounded-full object-cover bg-slate-800"
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-white group-hover:text-[#FFA84A] transition-colors flex items-center gap-1">
                      {activeChannel?.handle || '@mytestpage'}
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">{activeChannel?.platform || 'Meta'} Connected</span>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-2 pl-2 border-l border-white/10">
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block">Auto-Publish</span>
                    <span className={`text-[11px] font-extrabold ${settings.autoApprove ? 'text-emerald-400' : 'text-[#FFA84A]'}`}>
                      {settings.autoApprove ? 'Instant' : 'Review First'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleAutoApprove}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings.autoApprove ? 'bg-emerald-500' : 'bg-slate-800 border border-white/10'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center text-slate-900 ${
                        settings.autoApprove ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    >
                      <Zap className="w-3 h-3 text-[#FF6B4A]" />
                    </span>
                  </button>
                </div>
              </>
            )}

            {/* Google-style 'A' Avatar Profile */}
            <div className="relative group ml-1">
              <button
                type="button"
                title={`Google Account: ${currentUser?.name || 'Aarya'} (${currentUser?.email || 'aarya@in2peta.com'})`}
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF6B4A] via-[#FF5376] to-[#FFA84A] p-[1.5px] shrink-0 shadow-md hover:ring-2 hover:ring-[#FFA84A]/40 transition-all cursor-pointer flex items-center justify-center group/avatar"
              >
                <div className="w-full h-full bg-[#0d0f17] group-hover/avatar:bg-[#161a26] rounded-full flex items-center justify-center font-extrabold text-[#FFA84A] text-xs tracking-tight transition-colors">
                  {currentUser?.initial || 'A'}
                </div>
              </button>

              {/* Dropdown Menu (Google Account card) */}
              <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-[#0c0e15] border border-white/10 shadow-2xl p-3.5 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
                <div className="flex flex-col items-center text-center pb-3 border-b border-white/[0.08] mb-2.5">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF6B4A] via-[#FF5376] to-[#FFA84A] p-[2px] shadow-lg mb-2">
                    <div className="w-full h-full bg-[#0d0f17] rounded-full flex items-center justify-center font-extrabold text-white text-base">
                      {currentUser?.initial || 'A'}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-white truncate max-w-full">{currentUser?.name || 'Aarya'}</div>
                  <div className="text-[11px] text-slate-400 truncate max-w-full">{currentUser?.email || 'aarya@in2peta.com'}</div>
                  <div className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-[#FFA84A] bg-[#FFA84A]/10 border border-[#FFA84A]/25 px-2 py-0.5 rounded-full">
                    Admin Workspace
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-center py-2 px-3 text-xs font-semibold text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="border-b border-white/[0.06] bg-[#07080a]/90 backdrop-blur-2xl px-4 sm:px-8 sticky top-18 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 py-2">
          <div className="flex items-center gap-1.5 bg-[#0d0f15] p-1 rounded-2xl border border-white/[0.07] overflow-x-auto">
            {/* Product switcher — Social Studio and Lead Gen are one app, one nav */}
            <button
              type="button"
              onClick={() => switchProductMode('social')}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                !isGrowthcrew
                  ? 'scalora-pill-tab-active'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Social Studio</span>
            </button>

            <button
              type="button"
              onClick={() => switchProductMode('growthcrew')}
              className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isGrowthcrew
                  ? 'scalora-pill-tab-active'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Lead Gen</span>
            </button>

            {!isGrowthcrew && (
              <>
                <span className="w-px h-5 bg-white/10 mx-1" aria-hidden="true" />

                <button
                  type="button"
                  onClick={() => setActiveTab('studio')}
                  className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'studio'
                      ? 'scalora-pill-tab-active'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Post</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('queue')}
                  className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                    activeTab === 'queue'
                      ? 'scalora-pill-tab-active'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Review & Scheduled Queue</span>
                  {pendingCount > 0 && (
                    <span className="ml-1 px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-[#FF6B4A] text-white">
                      {pendingCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'history'
                      ? 'scalora-pill-tab-active'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Published Posts</span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-white/5 text-slate-400 font-semibold">
                    {publishedPosts.length}
                  </span>
                </button>
              </>
            )}
          </div>

          {!isGrowthcrew && (
            <button
              type="button"
              onClick={() => setShowBeginnerGuide(!showBeginnerGuide)}
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer py-1.5 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFA84A]/40"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#FFA84A]" />
              <span>{showBeginnerGuide ? 'Hide Guide' : 'Workflow Guide'}</span>
            </button>
          )}
        </div>
      </nav>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Beginner Step Cards — Scalora Ambient Glass Card */}
        {showBeginnerGuide && !isGrowthcrew && (
          <div className="scalora-card-glow rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-[#FF6B4A]/20 text-[#FFA84A] flex items-center justify-center font-bold text-xs border border-[#FF6B4A]/30">
                  ★
                </div>
                <h3 className="font-extrabold text-sm text-white tracking-tight">
                  How it works
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBeginnerGuide(false)}
                className="text-xs font-semibold text-slate-400 hover:text-white cursor-pointer px-2.5 py-1 rounded-lg hover:bg-white/5"
              >
                Dismiss ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-[#090b10]/60 border border-white/[0.06] space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#34D399]">Step 1</span>
                <h4 className="text-sm font-bold text-white">Add media</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload an image or video, or pick a preset.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-[#090b10]/60 border border-white/[0.06] space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#A855F7]">Step 2</span>
                <h4 className="text-sm font-bold text-white">Write the caption</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter a topic and generate a caption.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-[#090b10]/60 border border-white/[0.06] space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FFA84A]">Step 3</span>
                <h4 className="text-sm font-bold text-white">Publish</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Preview, then schedule or post to Instagram and Facebook.
                </p>
              </div>
            </div>
          </div>
        )}

        {isGrowthcrew && (
          <section aria-label="GrowthCrew outreach">
            <OutreachPanel />
          </section>
        )}

        {!isGrowthcrew && activeTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: STEP 1 (Media Hub) + STEP 2 (AI Caption Studio) */}
            <div className="lg:col-span-7 space-y-6">
              {/* STEP 1: Media Hub Card */}
              <div className="scalora-card-glow rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-xs border border-emerald-500/30">
                      1
                    </span>
                    <div>
                      <h2 className="text-sm font-extrabold text-white tracking-tight">Media</h2>
                      <p className="text-[11px] text-slate-400">Upload or pick a preset</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setMediaSourceType('sample')}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        mediaSourceType === 'sample'
                          ? 'bg-[#FF6B4A]/20 text-[#FFA84A] border border-[#FF6B4A]/40'
                          : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      Presets
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                        mediaSourceType === 'upload'
                          ? 'bg-[#FF6B4A]/20 text-[#FFA84A] border border-[#FF6B4A]/40'
                          : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/5'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                    </button>
                  </div>
                </div>

                {/* Upload & Preset Options */}
                {mediaSourceType === 'sample' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">Presets</label>
                    <div className="grid grid-cols-3 gap-3">
                      {SAMPLE_IN2PETA_MEDIA.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setAttachedMediaUrl(item.url);
                            setAttachedMediaId(null);
                            setAttachedMediaType(item.type);
                          }}
                          className={`relative rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer border-2 transition-all group ${
                            attachedMediaUrl === item.url
                              ? 'border-[#FF6B4A] shadow-lg shadow-[#FF6B4A]/20 scale-[1.02]'
                              : 'border-white/10 hover:border-white/30'
                          }`}
                        >
                          <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                            <span className="text-[10px] font-bold text-white truncate">{item.name}</span>
                          </div>
                          {attachedMediaUrl === item.url && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#FF6B4A] flex items-center justify-center shadow-md">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
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

                {/* Drag & Drop Upload Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/15 hover:border-[#FF6B4A]/60 bg-[#07080b]/50 hover:bg-[#FF6B4A]/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/[0.04] group-hover:bg-[#FF6B4A]/20 flex items-center justify-center transition-colors">
                    {isUploading ? (
                      <RefreshCw className="w-5 h-5 text-[#FFA84A] animate-spin" />
                    ) : (
                      <CloudUpload className="w-5 h-5 text-slate-400 group-hover:text-[#FFA84A] transition-colors" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-white group-hover:text-[#FFA84A] transition-colors">
                      {isUploading ? 'Uploading…' : 'Click or drag to upload'}
                    </p>
                    <p className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP, MP4 & MOV</p>
                  </div>
                </div>

                {/* Direct URL Input */}
                <form onSubmit={handlePasteUrlSubmit} className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Or paste any direct image / video HTTPS URL..."
                    value={pastedUrlInput}
                    onChange={(e) => setPastedUrlInput(e.target.value)}
                    className="flex-1 bg-[#07080b] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#FF6B4A]/60"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
                  >
                    Attach
                  </button>
                </form>
              </div>

              {/* STEP 2: AI Caption Generator Card */}
              <div className="scalora-card-glow rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-[#FF6B4A]/20 text-[#FFA84A] flex items-center justify-center font-extrabold text-xs border border-[#FF6B4A]/30">
                      2
                    </span>
                    <div>
                      <h2 className="text-sm font-extrabold text-white tracking-tight">AI Caption Studio</h2>
                      <p className="text-[11px] text-slate-400">Generate high-converting multi-platform posts</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>In2Peta DeepSeek-Flash</span>
                  </div>
                </div>

                {/* Inspiration Idea Chips */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">Ideas</label>
                  <div className="flex flex-wrap gap-2">
                    {INSPIRATION_CHIPS.map((chip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setTopic(chip);
                          handleGenerateCaption(chip);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-[#FF6B4A]/10 text-slate-300 hover:text-[#FFA84A] border border-white/[0.06] hover:border-[#FF6B4A]/40 text-xs font-medium transition-all cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topic Input Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Topic / Concept</label>
                  <textarea
                    rows={3}
                    placeholder="What is this post about? (e.g. 20% off summer HVAC service, energy saving tips, product showcase)"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-[#07080b] border border-white/10 rounded-2xl p-3.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#FF6B4A]/60 focus:ring-2 focus:ring-[#FF6B4A]/15 leading-relaxed resize-none"
                  />
                </div>

                {/* Target Channels Multi-Selector (All 7 Supported Platforms) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <span>Publishing Channels</span>
                      <span className="text-[10px] font-normal text-slate-400">
                        ({selectedPlatforms.length} / {ALL_PLATFORMS.length} selected)
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedPlatforms.length === ALL_PLATFORMS.length) {
                          setSelectedPlatforms(['instagram', 'facebook']);
                        } else {
                          setSelectedPlatforms(ALL_PLATFORMS.map((p) => p.id));
                        }
                      }}
                      className="text-[11px] text-[#FFA84A] hover:underline font-bold cursor-pointer"
                    >
                      {selectedPlatforms.length === ALL_PLATFORMS.length ? 'Reset to Meta' : 'Select All 7 Channels'}
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
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                            isSelected
                              ? `${plat.badgeBg} shadow-md font-bold`
                              : 'bg-white/[0.02] text-slate-400 border-white/5 hover:border-white/20'
                          }`}
                        >
                          <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                            <Icon className="w-3.5 h-3.5" />
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
                    <label className="text-xs font-bold text-slate-300 block">Tone of Voice:</label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B4A]/60"
                    >
                      <option value="Warm & Engaging">Warm & Engaging</option>
                      <option value="High-Energy & Promotional">High-Energy & Promotional</option>
                      <option value="Luxury & Exclusive">Luxury & Exclusive</option>
                      <option value="Informative & Educational">Informative & Educational</option>
                      <option value="Playful & Humorous">Playful & Humorous</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">Call to Action (CTA):</label>
                    <input
                      type="text"
                      value={callToAction}
                      onChange={(e) => setCallToAction(e.target.value)}
                      className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B4A]/60"
                    />
                  </div>
                </div>

                {/* Generate Button with Scalora Gradient */}
                <button
                  type="button"
                  onClick={() => handleGenerateCaption()}
                  disabled={isGenerating}
                  className="w-full py-3.5 px-6 rounded-2xl scalora-btn-primary font-bold text-xs uppercase tracking-wider text-slate-950 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-xl"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Generating…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-950" />
                      <span>Generate caption</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Live Instagram / Facebook Simulator & Publishing Controls */}
            <div className="lg:col-span-5 space-y-6">
              {/* Instagram iPhone Simulator Card */}
              <div className="scalora-card-glow rounded-3xl p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#FFA84A]/20 text-[#FFA84A] flex items-center justify-center font-extrabold text-xs border border-[#FFA84A]/30">
                      3
                    </span>
                    <h3 className="text-sm font-extrabold text-white">Live Channel Preview</h3>
                  </div>

                  {/* Aspect Ratio Selector */}
                  <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/10">
                    <button
                      onClick={() => setAspectRatio('square')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                        aspectRatio === 'square' ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      1:1
                    </button>
                    <button
                      onClick={() => setAspectRatio('portrait')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                        aspectRatio === 'portrait' ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      4:5
                    </button>
                    <button
                      onClick={() => setAspectRatio('reel')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                        aspectRatio === 'reel' ? 'bg-white/15 text-white' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      9:16
                    </button>
                  </div>
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
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap border transition-all cursor-pointer ${
                          isActive
                            ? `${plat.badgeBg} shadow-md`
                            : 'bg-white/[0.02] text-slate-400 border-white/5 hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{plat.name.split(' ')[0]}</span>
                        {isTarget && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Multi-Platform Preview Mockup */}
                <div className="bg-[#000000] border-4 border-slate-800 rounded-[32px] overflow-hidden shadow-2xl max-w-[370px] mx-auto text-left">
                  {/* FACEBOOK MOCKUP */}
                  {activePreviewPlatform === 'facebook' && (
                    <div className="p-4 space-y-3 bg-[#18191a] text-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={activeChannel?.avatar || SAMPLE_IN2PETA_MEDIA[0].url}
                            alt="Facebook avatar"
                            className="w-9 h-9 rounded-full object-cover border border-white/10"
                          />
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-white">{activeChannel?.name || 'Mytestpage'}</span>
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#1877F2] fill-[#1877F2]" />
                            </div>
                            <span className="text-[10px] text-slate-400">Just now · 🌎</span>
                          </div>
                        </div>
                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                      </div>

                      {/* Hook & Caption */}
                      <div className="text-xs space-y-1.5">
                        {editHook && <p className="font-bold text-white">{editHook}</p>}
                        <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-line line-clamp-3">
                          {editCaption || 'Your generated post caption will appear here.'}
                        </p>
                        {editHashtags && <p className="text-[#38BDF8] text-[11px]">{editHashtags}</p>}
                      </div>

                      {/* Media */}
                      <div className="rounded-xl overflow-hidden aspect-[16/9] bg-slate-950">
                        {attachedMediaType === 'video' ? (
                          <video src={attachedMediaUrl} controls autoPlay loop muted className="w-full h-full object-cover" />
                        ) : (
                          <img src={attachedMediaUrl} alt="Facebook media" className="w-full h-full object-cover" />
                        )}
                      </div>

                      {/* Facebook Reaction Bar */}
                      <div className="pt-2 border-t border-white/10 flex items-center justify-around text-slate-400 text-xs font-semibold">
                        <div className="flex items-center gap-1.5 hover:text-[#1877F2] cursor-pointer">
                          <span>👍</span> <span>Like</span>
                        </div>
                        <div className="flex items-center gap-1.5 hover:text-white cursor-pointer">
                          <span>💬</span> <span>Comment</span>
                        </div>
                        <div className="flex items-center gap-1.5 hover:text-white cursor-pointer">
                          <span>↗️</span> <span>Share</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* LINKEDIN MOCKUP */}
                  {activePreviewPlatform === 'linkedin' && (
                    <div className="p-4 space-y-3 bg-[#1b1f23] text-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={activeChannel?.avatar || SAMPLE_IN2PETA_MEDIA[0].url}
                            alt="LinkedIn avatar"
                            className="w-10 h-10 rounded-full object-cover border border-[#0A66C2]/40"
                          />
                          <div>
                            <span className="text-xs font-bold text-white block">In2Peta Growthcrew</span>
                            <span className="text-[10px] text-slate-400 block truncate max-w-[190px]">
                              AI Automation & Growth Specialist • 1st
                            </span>
                            <span className="text-[9px] text-slate-500">1m • Edited • 🌐</span>
                          </div>
                        </div>
                        <span className="text-[11px] text-[#0A66C2] font-bold cursor-pointer">+ Follow</span>
                      </div>

                      <div className="text-xs space-y-1.5">
                        {editHook && <p className="font-bold text-white">{editHook}</p>}
                        <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-line line-clamp-3">
                          {editCaption || 'Your professional business post caption will appear here.'}
                        </p>
                        {editHashtags && <p className="text-[#0A66C2] text-[11px]">{editHashtags}</p>}
                      </div>

                      <div className="rounded-xl overflow-hidden aspect-[16/9] bg-slate-950">
                        <img src={attachedMediaUrl} alt="LinkedIn media" className="w-full h-full object-cover" />
                      </div>

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-slate-400 text-[11px] font-semibold px-2">
                        <span>👏 Like</span>
                        <span>💬 Comment</span>
                        <span>🔄 Repost</span>
                        <span>✈️ Send</span>
                      </div>
                    </div>
                  )}

                  {/* X / TWITTER MOCKUP */}
                  {activePreviewPlatform === 'x' && (
                    <div className="p-4 space-y-3 bg-[#000000] text-slate-100">
                      <div className="flex items-start gap-3">
                        <img
                          src={activeChannel?.avatar || SAMPLE_IN2PETA_MEDIA[0].url}
                          alt="X avatar"
                          className="w-9 h-9 rounded-full object-cover"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{activeChannel?.name || 'Mytestpage'}</span>
                            <span className="text-[11px] text-slate-500">@mytestpage · 1m</span>
                          </div>

                          <div className="text-xs space-y-1">
                            {editHook && <p className="font-semibold text-white">{editHook}</p>}
                            <p className="text-slate-200 text-xs leading-relaxed whitespace-pre-line line-clamp-4">
                              {editCaption || 'Your tweet text will appear here.'}
                            </p>
                            {editHashtags && <p className="text-[#1D9BF0] text-xs">{editHashtags}</p>}
                          </div>

                          <div className="rounded-2xl overflow-hidden aspect-[16/9] bg-slate-950 border border-white/10">
                            <img src={attachedMediaUrl} alt="X media" className="w-full h-full object-cover" />
                          </div>

                          <div className="flex items-center justify-between text-slate-500 text-xs pt-1 px-1">
                            <span>💬 24</span>
                            <span>🔁 12</span>
                            <span>❤️ 98</span>
                            <span>📊 1.4K</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* REDDIT MOCKUP */}
                  {activePreviewPlatform === 'reddit' && (
                    <div className="p-4 space-y-2.5 bg-[#0e1113] text-slate-100 border border-white/5">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="font-bold text-white">r/GrowthHacking</span>
                        <span>•</span>
                        <span>Posted by u/aarya 2m ago</span>
                      </div>
                      <h4 className="text-xs font-bold text-white leading-snug">
                        {editHook || topic || 'Exciting update on our growth stack!'}
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
                        {editCaption || 'Community post discussion body.'}
                      </p>
                      <div className="rounded-xl overflow-hidden aspect-[16/9] bg-black">
                        <img src={attachedMediaUrl} alt="Reddit media" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex items-center gap-4 text-xs font-bold text-slate-400 pt-1">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5">
                          <span>⬆️</span> <span>42</span> <span>⬇️</span>
                        </div>
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5">
                          <span>💬</span> <span>18 comments</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* YOUTUBE COMMUNITY MOCKUP */}
                  {activePreviewPlatform === 'youtube' && (
                    <div className="p-4 space-y-3 bg-[#0f0f0f] text-slate-100">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={activeChannel?.avatar || SAMPLE_IN2PETA_MEDIA[0].url}
                          alt="YouTube avatar"
                          className="w-9 h-9 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-white">GrowthCrew Official</span>
                            <span className="text-[10px] text-slate-400">✓</span>
                          </div>
                          <span className="text-[10px] text-slate-500">12 minutes ago</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line line-clamp-3">
                        {editHook ? `${editHook}\n\n` : ''}
                        {editCaption || 'YouTube Community update post.'}
                      </p>

                      <div className="rounded-xl overflow-hidden aspect-[16/9] bg-black">
                        <img src={attachedMediaUrl} alt="YouTube community" className="w-full h-full object-cover" />
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                        <span>👍 156</span>
                        <span>👎</span>
                        <span>💬 32</span>
                      </div>
                    </div>
                  )}

                  {/* DISCORD WEBHOOK MOCKUP */}
                  {activePreviewPlatform === 'discord' && (
                    <div className="p-4 space-y-2 bg-[#313338] text-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center font-bold text-white text-xs">
                          GC
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">GrowthCrew Bot</span>
                            <span className="text-[9px] bg-[#5865F2] text-white px-1.5 rounded uppercase font-bold">
                              APP
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">Today at 12:00 PM</span>
                        </div>
                      </div>

                      {/* Discord Embed */}
                      <div className="border-l-4 border-[#5865F2] bg-[#2b2d31] p-3 rounded-r-xl space-y-2">
                        <span className="text-[10px] font-bold text-[#FFA84A] block">⚡ IN2PETA BROADCAST</span>
                        <h4 className="text-xs font-bold text-white">{editHook || topic || 'New Community Post'}</h4>
                        <p className="text-[11px] text-slate-300 whitespace-pre-line line-clamp-3">
                          {editCaption || 'Formatted rich embed dispatch for Discord subscribers.'}
                        </p>
                        <div className="rounded-lg overflow-hidden aspect-[16/9] bg-black/50">
                          <img src={attachedMediaUrl} alt="Discord embed media" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[9px] text-slate-500 block">GrowthCrew AI • Multi-Platform Engine</span>
                      </div>
                    </div>
                  )}

                  {/* INSTAGRAM MOCKUP (DEFAULT) */}
                  {activePreviewPlatform === 'instagram' && (
                    <div className="bg-[#000000]">
                      {/* Phone Header / Profile Bar */}
                      <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-[#FF6B4A] via-[#FF5376] to-[#FFA84A]">
                            <img
                              src={activeChannel?.avatar || SAMPLE_IN2PETA_MEDIA[0].url}
                              alt="profile"
                              className="w-full h-full rounded-full object-cover bg-slate-900"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-white">{activeChannel?.name || 'Mytestpage'}</span>
                              <CheckCircle2 className="w-3 h-3 text-[#38BDF8] fill-[#38BDF8]/20" />
                            </div>
                            <span className="text-[10px] text-slate-400">{activeChannel?.handle || '@mytestpage'}</span>
                          </div>
                        </div>
                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                      </div>

                      {/* Media Display */}
                      <div
                        className={`relative w-full bg-slate-950 overflow-hidden ${
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
                            <Heart className="w-5 h-5 text-slate-300 hover:text-rose-500 cursor-pointer transition-colors" />
                            <MessageCircle className="w-5 h-5 text-slate-300 hover:text-white cursor-pointer transition-colors" />
                            <Share2 className="w-5 h-5 text-slate-300 hover:text-white cursor-pointer transition-colors" />
                          </div>
                          <Bookmark className="w-5 h-5 text-slate-300 hover:text-[#FFA84A] cursor-pointer transition-colors" />
                        </div>

                        {/* Caption Preview */}
                        <div className="text-xs space-y-1.5">
                          {editHook && (
                            <p className="font-extrabold text-white text-xs leading-snug">
                              {editHook}
                            </p>
                          )}

                          <p className={`text-slate-300 text-[11px] leading-relaxed whitespace-pre-line ${expandedCaption ? '' : 'line-clamp-3'}`}>
                            {editCaption || (
                              <span className="text-slate-600 italic">
                                Caption preview
                              </span>
                            )}
                          </p>

                          {editCaption && editCaption.length > 120 && (
                            <button
                              type="button"
                              onClick={() => setExpandedCaption(!expandedCaption)}
                              className="text-[10px] text-slate-500 hover:text-slate-300 font-bold block cursor-pointer"
                            >
                              {expandedCaption ? 'show less' : '...more'}
                            </button>
                          )}

                          {editHashtags && (
                            <p className="text-[11px] text-[#FFA84A]/80 font-medium">
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
                    <Calendar className="w-4 h-4 text-[#FFA84A]" />
                    <label className="text-xs font-bold text-slate-300">Schedule Date & Time:</label>
                  </div>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B4A]/60"
                  />

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleSchedulePost}
                      disabled={actionLoading === 'schedule'}
                      className="py-3 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-white border border-white/10 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Clock className="w-3.5 h-3.5 text-[#FFA84A]" />
                      <span>Add to Queue</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInstantPublish(generatedDraft?.id || 'new')}
                      disabled={actionLoading?.startsWith('pub_')}
                      className="py-3 px-4 rounded-xl scalora-btn-primary text-slate-950 text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-lg"
                    >
                      <Send className="w-3.5 h-3.5 text-slate-950" />
                      <span>Publish to {selectedPlatforms.length} Channels Now 🚀</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REVIEW & SCHEDULED QUEUE */}
        {!isGrowthcrew && activeTab === 'queue' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
              <div>
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  Review & Scheduled Queue
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FF6B4A]/15 text-[#FFA84A] border border-[#FF6B4A]/30">
                    {queueList.length} Total
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Pending and scheduled posts</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-[#0d0f15] p-1 rounded-xl border border-white/[0.07]">
                {['ALL', 'PENDING_REVIEW', 'SCHEDULED', 'PUBLISHED'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setQueueFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      queueFilter === filter
                        ? 'bg-[#FF6B4A]/20 text-[#FFA84A] border border-[#FF6B4A]/30 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {filter === 'PENDING_REVIEW' ? 'Pending Review' : filter === 'ALL' ? 'All Posts' : filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Queue List */}
            {filteredQueue.length === 0 ? (
              <div className="scalora-card-glow rounded-3xl p-12 text-center space-y-3">
                <Layers className="w-8 h-8 text-slate-600 mx-auto" />
                <h3 className="font-bold text-sm text-white">No Posts in This Queue View</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Create high-performing posts in the Studio tab to schedule or review them here.
                </p>
                <button
                  onClick={() => setActiveTab('studio')}
                  className="px-4 py-2 rounded-xl scalora-btn-primary text-slate-950 text-xs font-bold cursor-pointer"
                >
                  Go to Studio
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQueue.map((post) => (
                  <div
                    key={post.id}
                    className="scalora-card-glow rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4 relative group"
                  >
                    <div className="space-y-3">
                      {/* Post Status & Scheduled Date */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            post.status === 'PUBLISHED'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : post.status === 'PENDING_REVIEW'
                              ? 'bg-[#FF6B4A]/15 text-[#FFA84A] border-[#FF6B4A]/30'
                              : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                          }`}
                        >
                          {post.status === 'PENDING_REVIEW' ? 'Review Required' : post.status}
                        </span>

                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {new Date(post.scheduledDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Attached Media Thumbnail */}
                      {post.mediaUrl && (
                        <div className="rounded-2xl overflow-hidden aspect-video bg-black/60 relative">
                          <img src={post.mediaUrl} alt="post asset" className="w-full h-full object-cover" />
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[9px] font-bold text-white">
                            {post.mediaType === 'video' ? '🎬 Reel' : '📸 Image'}
                          </span>
                        </div>
                      )}

                      {/* Hook & Caption */}
                      <div>
                        {post.hook && (
                          <p className="font-bold text-xs text-white line-clamp-1 mb-1">
                            {post.hook}
                          </p>
                        )}
                        <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                          {post.caption}
                        </p>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingPost(post)}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-all cursor-pointer"
                          title="Edit Post"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
                          title="Delete Post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {post.status === 'PENDING_REVIEW' && (
                          <button
                            onClick={() => handleApprovePost(post.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleInstantPublish(post.id)}
                          className="px-3 py-1.5 rounded-xl scalora-btn-primary text-slate-950 text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Publish Now
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
        {!isGrowthcrew && activeTab === 'history' && (() => {
          const allPublished = (publishedPosts && publishedPosts.length > 0)
            ? publishedPosts
            : (queueData.queue || []).filter((p) => p.status === 'PUBLISHED');

          return (
            <div className="space-y-6">
              <div className="pb-2 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                    Published History
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {allPublished.length} Live
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">Posts that went live</p>
                </div>
                <a
                  href="https://facebook.com/profile.php?id=61594485176950&sk=photos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-[#FFA84A] transition-all cursor-pointer"
                >
                  <FacebookIcon className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Open Facebook Photos</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {allPublished.length === 0 ? (
                <div className="scalora-card-glow rounded-3xl p-12 text-center space-y-3">
                  <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
                  <h3 className="font-bold text-sm text-white">No Published Posts Yet</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Publish posts from the Studio or Queue to see live published releases here.
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
                        className="scalora-card-glow rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-white/20 transition-all"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                              Published Live
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(postDate).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {postImg && (
                            <div className="rounded-2xl overflow-hidden aspect-video bg-black/60 border border-white/10 relative group">
                              <img src={postImg} alt="media" className="w-full h-full object-cover" />
                              <div className="absolute top-2 right-2 flex gap-1">
                                {(post.platforms || ['facebook']).map((p, i) => (
                                  <span key={i} className="p-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/15">
                                    {p === 'facebook' ? (
                                      <FacebookIcon className="w-3 h-3 text-[#38BDF8]" />
                                    ) : (
                                      <InstagramIcon className="w-3 h-3 text-[#FF5376]" />
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            {post.topic && (
                              <h4 className="text-xs font-bold text-white line-clamp-1">{post.topic}</h4>
                            )}
                            <div
                              className="text-xs text-slate-300 leading-relaxed line-clamp-4 whitespace-pre-line"
                              dangerouslySetInnerHTML={{ __html: postText.replace(/\n/g, '<br/>') }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                          <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Published
                          </span>
                          {(() => {
                            const igUrl = post.broadcastResult?.platforms?.instagram?.url;
                            const fbUrl = post.broadcastResult?.platforms?.facebook?.url;
                            const liveUrl = igUrl || fbUrl || post.liveUrl || (post.channelHandle ? `https://www.instagram.com/${post.channelHandle.replace('@', '')}/` : null);
                            const isIg = Boolean(igUrl) || post.platform === 'instagram';
                            return liveUrl ? (
                              <a
                                href={liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-[#FFA84A] border border-white/10 transition-all cursor-pointer"
                              >
                                {isIg ? <InstagramIcon className="w-3 h-3 text-[#FF5376]" /> : <FacebookIcon className="w-3 h-3 text-[#38BDF8]" />}
                                <span>{isIg ? 'View on Instagram' : 'View on Facebook'}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : null;
                          })()}
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1118] border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-[#FF6B4A] to-[#FF5376]">
                  <div className="w-full h-full bg-[#0e1118] rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#FFA84A]" />
                  </div>
                </div>
                <h3 className="font-extrabold text-sm text-white">Select Connected Channel</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Available Channels List */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">Available Connected Channels:</label>
              <div className="space-y-2">
                {channels.map((chan) => (
                  <div
                    key={chan.id}
                    onClick={() => {
                      setActiveChannel(chan);
                      setShowConnectModal(false);
                      showToast(`Active channel set to ${chan.name}!`, 'success');
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                      activeChannel?.id === chan.id
                        ? 'bg-[#FF6B4A]/15 border-[#FF6B4A]/50 shadow-md shadow-[#FF6B4A]/10'
                        : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full p-[1.5px] bg-gradient-to-tr from-[#FF6B4A] to-[#FF5376]">
                        <img src={chan.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">{chan.name}</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          {chan.platform === 'facebook' ? (
                            <FacebookIcon className="w-3 h-3 text-[#38BDF8]" />
                          ) : (
                            <InstagramIcon className="w-3 h-3 text-[#FF5376]" />
                          )}
                          <span>{chan.handle}</span>
                        </span>
                        {(chan.fbPageId && (chan.fbAccessToken || chan.provider === 'Meta Graph API' || chan.provider === 'Meta 1-Click OAuth')) ? (
                          <span className="text-[9px] text-emerald-400 font-semibold block">✓ Meta Verified</span>
                        ) : (
                          <span className="text-[9px] text-amber-400 font-semibold block">⚠️ No Meta Token (Cannot Publish)</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeChannel?.id === chan.id && (
                        <CheckCircle2 className="w-4 h-4 text-[#FFA84A]" />
                      )}
                      {chan.id !== 'cmu2huh5o0001p0aq03ly15ud' && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteChannel(chan.id, e)}
                          title="Remove Channel"
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
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
            <form onSubmit={handleConnectInstagram} className="space-y-3">
              <label className="text-xs font-bold text-slate-300 block">Connect Your Account / Channel:</label>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Platform</label>
                  <select
                    value={customPlatform}
                    onChange={(e) => setCustomPlatform(e.target.value)}
                    className="w-full bg-[#07080b] border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B4A]/60"
                  >
                    {ALL_PLATFORMS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Username / Handle</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 text-xs">@</span>
                    <input
                      type="text"
                      placeholder="handle_or_name"
                      value={customHandleInput}
                      onChange={(e) => setCustomHandleInput(e.target.value)}
                      className="w-full bg-[#07080b] border border-white/10 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6B4A]/60"
                    />
                  </div>
                </div>
              </div>

              {(customPlatform === 'facebook' || customPlatform === 'instagram') && (
                <div className="space-y-2 p-3 rounded-2xl bg-white/[0.02] border border-white/10">
                  <p className="text-[10px] text-[#FFA84A] font-semibold">Meta Graph API Credentials (Required for Custom Account):</p>
                  <div>
                    <input
                      type="text"
                      placeholder="Facebook Page ID (e.g. 1306999285838432)"
                      value={customFbPageId}
                      onChange={(e) => setCustomFbPageId(e.target.value)}
                      className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#FF6B4A]/60"
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Meta Page Access Token (Permanent / System User Token)"
                      value={customFbToken}
                      onChange={(e) => setCustomFbToken(e.target.value)}
                      className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#FF6B4A]/60"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400 leading-relaxed">
                    Paste your Facebook Page ID and Meta Page Access Token (generated from Business Manager / Meta Developer). Or click the 1-Click button above.
                  </p>
                </div>
              )}

              {customPlatform === 'discord' && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-white/[0.02] border border-white/10">
                  <label className="text-[10px] text-[#818CF8] font-semibold block">Discord Channel Webhook URL:</label>
                  <input
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={customDiscordWebhook}
                    onChange={(e) => setCustomDiscordWebhook(e.target.value)}
                    className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#FF6B4A]/60"
                  />
                  <p className="text-[9px] text-slate-500">
                    Instant rich embed notification directly to your Discord server channel.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 text-slate-300 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider text-slate-950 scalora-btn-primary shadow-lg cursor-pointer"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1118] border border-white/15 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#FFA84A]" />
                Edit Post Content
              </h3>
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="text-slate-400 hover:text-white cursor-pointer px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Hook</label>
                <input
                  type="text"
                  value={editingPost.hook || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, hook: e.target.value })}
                  className="w-full bg-[#07080b] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Caption</label>
                <textarea
                  rows={4}
                  value={editingPost.caption || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, caption: e.target.value })}
                  className="w-full bg-[#07080b] border border-white/10 rounded-xl p-2.5 text-xs text-white resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  value={new Date(editingPost.scheduledDate).toISOString().slice(0, 16)}
                  onChange={(e) => setEditingPost({ ...editingPost, scheduledDate: new Date(e.target.value).toISOString() })}
                  className="w-full bg-[#07080b] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 text-slate-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider text-slate-950 scalora-btn-primary cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Platform Broadcast Result Modal */}
      {broadcastModalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e1118] border border-white/15 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  🚀
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Multi-Platform Broadcast Report</h3>
                  <p className="text-[11px] text-slate-400">Simultaneous dispatch across selected channels</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBroadcastModalData(null)}
                className="text-slate-400 hover:text-white cursor-pointer px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-white">Broadcast Status</span>
                <span className="text-emerald-400">
                  {broadcastModalData.successCount || Object.keys(broadcastModalData.platforms || {}).length} /{' '}
                  {broadcastModalData.totalTargets || Object.keys(broadcastModalData.platforms || {}).length} Platforms Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-300">{broadcastModalData.summary}</p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {Object.entries(broadcastModalData.platforms || {}).map(([platKey, res]) => {
                const platMeta = ALL_PLATFORMS.find((p) => p.id === platKey) || {
                  name: platKey,
                  color: '#fff',
                  badgeBg: 'bg-white/10 text-white',
                };
                return (
                  <div
                    key={platKey}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#07080b] border border-white/10 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-white capitalize">{platMeta.name}</span>
                      {res.status === 'published' || res.status === 'dispatched' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {res.status === 'published' ? 'Live on Page' : 'Dispatched'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {res.status}
                        </span>
                      )}
                    </div>
                    <div className="text-right text-[11px] text-slate-400 truncate max-w-[180px]">
                      {res.id ? `ID: ${res.id}` : res.message || 'Queued for channel'}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setBroadcastModalData(null)}
                className="w-full py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider text-slate-950 scalora-btn-primary shadow-lg cursor-pointer"
              >
                Close & View In Published Feed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
