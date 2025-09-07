"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface LandingHero {
	id: number;
	title: string;
	subtitle: string | null;
	images: string[];
	background_color: string | null;
}

// Showcase images section removed

export default function AdminLandingPage() {
	const [hero, setHero] = useState<LandingHero | null>(null);
	const [loading, setLoading] = useState(true);
	const [heroTitleAccent1, setHeroTitleAccent1] = useState<string>('#a855f7'); // purple
	const [heroTitleAccent2, setHeroTitleAccent2] = useState<string>('#14b8a6'); // teal
	const [chatTitle, setChatTitle] = useState<string>("");
	const [chatSubtitle, setChatSubtitle] = useState<string>("");
	const [featuresTitle, setFeaturesTitle] = useState<string>("");
	const [featuresSubtitle, setFeaturesSubtitle] = useState<string>("");
	const [featuresBackgroundColor, setFeaturesBackgroundColor] = useState<string>('solid-blue');
	const [featuresTitleAccent1, setFeaturesTitleAccent1] = useState<string>('#a855f7'); // purple
	const [featuresTitleAccent2, setFeaturesTitleAccent2] = useState<string>('#14b8a6'); // teal
	const [features, setFeatures] = useState<Array<{ id?: string; title: string; description: string; icon?: string; order_index?: number; is_active?: boolean }>>([]);
	const [isSaving, setIsSaving] = useState(false);

	const isValid = useMemo(() => {
		console.log('🔍 [ADMIN] Validating hero:', { hasHero: !!hero, title: hero?.title, titleLength: hero?.title?.trim().length });
		return !!hero && (hero.title || "").trim().length > 0;
	}, [hero]);

    const ICON_OPTIONS: Array<{ value: string; label: string }> = [
        { value: 'message', label: 'Message' },
        { value: 'image', label: 'Image' },
        { value: 'shield', label: 'Shield' },
        { value: 'stethoscope', label: 'Stethoscope' },
        { value: 'heart', label: 'Heart' },
        { value: 'lock', label: 'Lock' },
        { value: 'globe', label: 'Globe' },
        { value: 'star', label: 'Star' },
        { value: 'bolt', label: 'Bolt' },
        { value: 'brain', label: 'Brain' },
    ];

    const BACKGROUND_COLOR_OPTIONS: Array<{ value: string; label: string; preview: string }> = [
        { value: 'gradient-blue', label: 'Blue Gradient', preview: 'bg-gradient-to-br from-blue-500 to-blue-700' },
        { value: 'gradient-purple', label: 'Purple Gradient', preview: 'bg-gradient-to-br from-purple-500 to-purple-700' },
        { value: 'gradient-green', label: 'Green Gradient', preview: 'bg-gradient-to-br from-green-500 to-green-700' },
        { value: 'gradient-orange', label: 'Orange Gradient', preview: 'bg-gradient-to-br from-orange-500 to-orange-700' },
        { value: 'gradient-pink', label: 'Pink Gradient', preview: 'bg-gradient-to-br from-pink-500 to-pink-700' },
        { value: 'solid-white', label: 'White', preview: 'bg-white border-2 border-gray-300' },
        { value: 'solid-gray', label: 'Light Gray', preview: 'bg-gray-200' },
        { value: 'solid-dark', label: 'Dark', preview: 'bg-gray-800' },
        { value: 'solid-blue', label: 'Navy Blue', preview: 'bg-[#0f1325]' },
        { value: 'solid-green', label: 'Green', preview: 'bg-green-600' },
    ];

    const iconEmoji = (key?: string) => {
        switch (key) {
            case 'image': return '🖼️';
            case 'shield': return '🛡️';
            case 'stethoscope': return '🩺';
            case 'heart': return '❤️';
            case 'lock': return '🔒';
            case 'globe': return '🌐';
            case 'star': return '⭐';
            case 'bolt': return '⚡';
            case 'brain': return '🧠';
            case 'message':
            default: return '💬';
        }
    };

	useEffect(() => {
		loadAllData();
	}, []);

	async function loadAllData() {
		setLoading(true);
		try {
			// Load all data in parallel
			const [heroRes, chatbotRes, featuresRes] = await Promise.all([
				fetch(`/api/landing/hero?t=${Date.now()}`),
				fetch("/api/landing/chatbot"),
				fetch("/api/landing/features")
			]);

			// Handle hero data
			if (heroRes.ok) {
				const heroData = await heroRes.json();
				console.log('📋 [ADMIN] Received hero data:', heroData);
				if (heroData) {
					const heroState = {
						id: 1,
						title: heroData.title || "",
						subtitle: heroData.subtitle || "",
						images: Array.isArray(heroData.images) && heroData.images.length > 0 ? heroData.images : [],
						background_color: heroData.background_color || "gradient-blue",
					};
					console.log('✅ [ADMIN] Setting hero state:', heroState);
					setHero(heroState);
					setHeroTitleAccent1(heroData.title_accent1 || '#a855f7');
					setHeroTitleAccent2(heroData.title_accent2 || '#14b8a6');
					console.log('✅ [ADMIN] Hero state set, title:', heroState.title);
				} else {
					// No data from database, set empty state
					console.log('⚠️ [ADMIN] No hero data found, setting empty state');
					setHero({
						id: 1,
						title: "",
						subtitle: "",
						images: [],
						background_color: "gradient-blue",
					});
				}
			} else {
				console.log('❌ [ADMIN] Failed to fetch hero data:', heroRes.status);
			}

			// Showcase images removed

			// Handle chatbot data
			if (chatbotRes.ok) {
				const chatbotData = await chatbotRes.json();
				if (chatbotData && (chatbotData.title || chatbotData.subtitle)) {
					setChatTitle(chatbotData.title || "");
					setChatSubtitle(chatbotData.subtitle || "");
				} else {
					// No data from database, set empty state
					setChatTitle("");
					setChatSubtitle("");
				}
			}

			// Handle features data
			if (featuresRes.ok) {
				const featuresData = await featuresRes.json();
				if (featuresData?.section) {
					setFeaturesTitle(featuresData.section.title || "");
					setFeaturesSubtitle(featuresData.section.subtitle || "");
					setFeaturesBackgroundColor(featuresData.section.background_color || 'solid-blue');
					setFeaturesTitleAccent1(featuresData.section.title_accent1 || '#a855f7');
					setFeaturesTitleAccent2(featuresData.section.title_accent2 || '#14b8a6');
				} else {
					// No data from database, set empty state
					setFeaturesTitle("");
					setFeaturesSubtitle("");
					setFeaturesBackgroundColor('solid-blue');
					setFeaturesTitleAccent1('#a855f7');
					setFeaturesTitleAccent2('#14b8a6');
				}
				if (Array.isArray(featuresData?.items)) setFeatures(featuresData.items);
			}
		} catch (error) {
			console.error("Error loading data:", error);
		} finally {
			setLoading(false);
		}
	}

	async function saveHero() {
		if (!hero) {
			console.log('❌ [ADMIN] No hero data to save');
			toast.error("No hero data to save");
			return;
		}
		console.log('🔄 [ADMIN] Saving hero data:', hero);
		setIsSaving(true);
		try {
			const res = await fetch("/api/landing/hero", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...hero,
					title_accent1: heroTitleAccent1,
					title_accent2: heroTitleAccent2
				}),
			});
			
			console.log('📋 [ADMIN] Save response status:', res.status);
			
			if (res.ok) {
				const result = await res.json();
				console.log('✅ [ADMIN] Hero save response:', result);
				toast.success("Hero section saved successfully!");
			} else {
				const errorText = await res.text();
				console.log('❌ [ADMIN] Hero save failed:', {
					status: res.status,
					statusText: res.statusText,
					error: errorText
				});
				toast.error(`Failed to save hero section: ${res.status} ${res.statusText}`);
			}
		} catch (error: unknown) {
			console.error("❌ [ADMIN] Error saving hero:", error);
			const msg = error instanceof Error ? error.message : String(error);
			toast.error(`An error occurred while saving hero section: ${msg}`);
		} finally {
			setIsSaving(false);
		}
	}

    // Showcase images save removed

	async function saveChatbot() {
		setIsSaving(true);
		try {
			const res = await fetch("/api/landing/chatbot", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ title: chatTitle, subtitle: chatSubtitle }),
			});
			if (res.ok) {
				toast.success("Chatbot section saved successfully!");
			} else {
				toast.error("Failed to save chatbot section");
			}
		} catch (error) {
			toast.error("An error occurred while saving chatbot section");
		} finally {
			setIsSaving(false);
		}
	}

	async function saveFeaturesSection() {
		setIsSaving(true);
		try {
		const res = await fetch('/api/landing/features', { 
			method: 'PUT', 
			headers: { 'Content-Type': 'application/json' }, 
			body: JSON.stringify({ 
				title: featuresTitle, 
				subtitle: featuresSubtitle, 
				background_color: featuresBackgroundColor,
				title_accent1: featuresTitleAccent1,
				title_accent2: featuresTitleAccent2
			}) 
		});
			if (res.ok) {
				toast.success("Features section saved successfully!");
			} else {
				toast.error("Failed to save features section");
			}
		} catch (error) {
			toast.error("An error occurred while saving features section");
		} finally {
			setIsSaving(false);
		}
	}

	async function addFeature() {
		try {
			const res = await fetch('/api/landing/features', { 
				method: 'POST', 
				headers: { 'Content-Type': 'application/json' }, 
				body: JSON.stringify({ title: 'New Feature', description: '', icon: 'message' }) 
			});
			if (res.ok) {
				const newFeature = await res.json();
				setFeatures(prev => [...prev, newFeature]);
				toast.success("Feature added successfully!");
			} else {
				toast.error("Failed to add feature");
			}
		} catch (error) {
			toast.error("An error occurred while adding feature");
		}
	}

	async function updateFeature(item: any) {
		if (!item?.id) return;
		try {
			const res = await fetch('/api/landing/features', { 
				method: 'PATCH', 
				headers: { 'Content-Type': 'application/json' }, 
				body: JSON.stringify(item) 
			});
			if (res.ok) {
				toast.success("Feature updated successfully!");
			} else {
				toast.error("Failed to update feature");
			}
		} catch (error) {
			toast.error("An error occurred while updating feature");
		}
	}

	async function deleteFeature(id: string) {
		try {
			const res = await fetch(`/api/landing/features?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
			if (res.ok) {
				setFeatures(prev => prev.filter(f => f.id !== id));
				toast.success("Feature deleted successfully!");
			} else {
				toast.error("Failed to delete feature");
			}
		} catch (error) {
			toast.error("An error occurred while deleting feature");
		}
	}

	function updateImage(idx: number, value: string) {
		if (!hero) return;
		const images = [...hero.images];
		images[idx] = value;
		setHero({ ...hero, images });
	}

	function addImage() {
		if (!hero) return;
		setHero({ ...hero, images: [...hero.images, ""] });
	}

	function removeImage(idx: number) {
		if (!hero) return;
		setHero({ ...hero, images: hero.images.filter((_, i) => i !== idx) });
	}

    // Showcase images handlers removed

	async function onUpload(idx: number, file: File) {
		const form = new FormData();
		form.append("file", file);
		form.append("filename", file.name);
		const res = await fetch("/api/landing/upload", { method: "POST", body: form });
		if (res.ok) {
			const data = await res.json();
			if (data?.url) updateImage(idx, data.url);
		}
	}

    // Showcase upload removed

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold text-gray-900 dark:text-white">Landing Page</h1>
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 className="text-lg font-semibold mb-4">Hero Section</h2>
				<div className="grid gap-4">
					<input className="border rounded p-2 bg-white dark:bg-gray-900" placeholder="Title" value={hero?.title || ""} onChange={(e) => setHero(h => h ? { ...h, title: e.target.value } : h)} />
					<textarea className="border rounded p-2 min-h-[100px] bg-white dark:bg-gray-900" placeholder="Subtitle" value={hero?.subtitle || ""} onChange={(e) => setHero(h => h ? { ...h, subtitle: e.target.value } : h)} />
					{/* Hero image upload */}
					<div className="border rounded p-4 bg-gray-50 dark:bg-gray-700">
						<label className="block text-sm font-medium mb-2">Hero Image</label>
						<div className="flex items-center gap-3">
							{hero?.images?.[0] && (
								<img src={hero.images[0]} alt="Hero" className="h-16 w-24 object-cover rounded border" />
							)}
							<input 
								className="border rounded p-2 flex-1 bg-white dark:bg-gray-900" 
								placeholder="Hero Image URL" 
								value={hero?.images?.[0] || ""} 
								onChange={(e) => setHero(h => h ? { ...h, images: [e.target.value, ...(h.images?.slice(1) || [])] } : h)} 
							/>
							<label className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm cursor-pointer">
								<input 
									type="file" 
									accept="image/*" 
									className="hidden" 
									onChange={async (e) => { 
										const f = e.target.files?.[0]; 
										if (!f) return; 
										const form = new FormData();
										form.append('file', f);
										form.append('filename', f.name);
										form.append('folder', 'hero');
										const res = await fetch('/api/landing/upload', { method: 'POST', body: form });
										if (res.ok) { 
											const data = await res.json(); 
											if (data?.url) setHero(h => h ? { ...h, images: [data.url, ...(h.images?.slice(1) || [])] } : h); 
										}
									}} 
								/>
								Upload
							</label>
						</div>
					</div>
					{/* Background Color Picker */}
					<div className="border rounded p-4 bg-gray-50 dark:bg-gray-700">
						<label className="block text-sm font-medium mb-3">Background Color</label>
						<div className="grid grid-cols-5 gap-3">
							{BACKGROUND_COLOR_OPTIONS.map((option) => (
								<div key={option.value} className="flex flex-col items-center">
									<button
										type="button"
										onClick={() => setHero(h => h ? { ...h, background_color: option.value } : h)}
										className={`w-12 h-12 rounded-lg border-2 transition-all ${
											hero?.background_color === option.value 
												? 'border-blue-500 ring-2 ring-blue-200' 
												: 'border-gray-300 hover:border-gray-400'
										} ${option.preview}`}
										title={option.label}
									/>
									<span className="text-xs mt-1 text-center text-gray-600 dark:text-gray-400">
										{option.label}
									</span>
								</div>
							))}
						</div>
					</div>
					{/* Hero Title Accent Colors */}
					<div className="border rounded p-4 bg-gray-50 dark:bg-gray-700">
						<label className="block text-sm font-medium mb-3">Hero Title Accent Colors</label>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">&quot;AI&quot; Color</label>
								<input
									type="color"
									value={heroTitleAccent1}
									onChange={(e) => setHeroTitleAccent1(e.target.value)}
									className="w-full h-10 rounded border border-gray-300"
								/>
							</div>
							<div>
								<label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">&quot;Health&quot; Color</label>
								<input
									type="color"
									value={heroTitleAccent2}
									onChange={(e) => setHeroTitleAccent2(e.target.value)}
									className="w-full h-10 rounded border border-gray-300"
								/>
							</div>
						</div>
					</div>
					<div>
						<button disabled={!isValid || isSaving} onClick={saveHero} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
							{isSaving ? "Saving..." : "Save"}
						</button>
					</div>
				</div>
			</div>

			{/* Showcase Images Section removed */}

			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 className="text-lg font-semibold mb-4">Key Features Section</h2>
				<div className="grid gap-4">
					<input className="border rounded p-2 bg-white dark:bg-gray-900" placeholder="Features Title" value={featuresTitle} onChange={(e) => setFeaturesTitle(e.target.value)} />
					<textarea className="border rounded p-2 min-h-[100px] bg-white dark:bg-gray-900" placeholder="Features Subtitle" value={featuresSubtitle} onChange={(e) => setFeaturesSubtitle(e.target.value)} />
					{/* Features Background Color Picker */}
					<div className="border rounded p-4 bg-gray-50 dark:bg-gray-700">
						<label className="block text-sm font-medium mb-3">Features Background Color</label>
						<div className="grid grid-cols-5 gap-3">
							{BACKGROUND_COLOR_OPTIONS.map((option) => (
								<div key={`feat-${option.value}`} className="flex flex-col items-center">
									<button
										type="button"
										onClick={() => setFeaturesBackgroundColor(option.value)}
										className={`w-12 h-12 rounded-lg border-2 transition-all ${
											featuresBackgroundColor === option.value
												? 'border-blue-500 ring-2 ring-blue-200'
												: 'border-gray-300 hover:border-gray-400'
										} ${option.preview}`}
										title={option.label}
									/>
									<span className="text-xs mt-1 text-center text-gray-600 dark:text-gray-400">
										{option.label}
									</span>
								</div>
							))}
						</div>
						<div className="mt-4">
							<button disabled={isSaving} onClick={saveFeaturesSection} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
								{isSaving ? "Saving..." : "Save Section"}
							</button>
						</div>
					</div>
					{/* Title Accent Colors */}
					<div className="border rounded p-4 bg-gray-50 dark:bg-gray-700">
						<label className="block text-sm font-medium mb-3">Title Accent Colors</label>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">&quot;AI&quot; Color</label>
								<input
									type="color"
									value={featuresTitleAccent1}
									onChange={(e) => setFeaturesTitleAccent1(e.target.value)}
									className="w-full h-10 rounded border border-gray-300"
								/>
							</div>
							<div>
								<label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">&quot;Health&quot; Color</label>
								<input
									type="color"
									value={featuresTitleAccent2}
									onChange={(e) => setFeaturesTitleAccent2(e.target.value)}
									className="w-full h-10 rounded border border-gray-300"
								/>
							</div>
						</div>
						<div className="mt-4">
							<button disabled={isSaving} onClick={saveFeaturesSection} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
								{isSaving ? "Saving..." : "Save Section"}
							</button>
						</div>
					</div>
					<div className="flex items-center justify-between">
						<span className="font-medium">Features</span>
						<button onClick={addFeature} className="px-3 py-2 rounded bg-teal-500 text-white">Add Feature</button>
					</div>
					<div className="space-y-3">
						{features.map((f) => (
							<div key={f.id} className="border rounded p-4 bg-gray-50 dark:bg-gray-700">
								<div className="grid gap-2 md:grid-cols-2">
									<input className="border rounded p-2 bg-white dark:bg-gray-900" placeholder="Feature Title" value={f.title} onChange={(e) => setFeatures(prev => prev.map(x => x.id === f.id ? { ...x, title: e.target.value } : x))} />
									<select className="border rounded p-2 bg-white dark:bg-gray-900" value={f.icon || ''} onChange={(e) => setFeatures(prev => prev.map(x => x.id === f.id ? { ...x, icon: e.target.value } : x))} >
										<option value="">Select Icon</option>
										{ICON_OPTIONS.map(option => (
											<option key={option.value} value={option.value}>{option.label} {iconEmoji(option.value)}</option>
										))}
									</select>
								</div>
								<textarea className="border rounded p-2 mt-2 w-full bg-white dark:bg-gray-900" placeholder="Feature Description" value={f.description || ''} onChange={(e) => setFeatures(prev => prev.map(x => x.id === f.id ? { ...x, description: e.target.value } : x))} />
								<div className="flex items-center gap-2 mt-2">
									<button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={() => updateFeature(f)}>Save</button>
									{f.id && <button className="px-3 py-2 rounded bg-red-600 text-white" onClick={() => deleteFeature(f.id!)}>Delete</button>}
								</div>
							</div>
					))}
					</div>
					<div>
						<button disabled={isSaving} onClick={saveFeaturesSection} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
							{isSaving ? "Saving..." : "Save Section"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}


