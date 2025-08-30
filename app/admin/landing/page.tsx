"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface LandingHero {
	id: number;
	title: string;
	subtitle: string | null;
	images: string[];
}

interface ShowcaseImages {
	id: number;
	image1: string;
	image2: string;
	image3: string;
}

export default function AdminLandingPage() {
	const [hero, setHero] = useState<LandingHero | null>(null);
	const [showcaseImages, setShowcaseImages] = useState<ShowcaseImages | null>(null);
	const [loading, setLoading] = useState(true);
	const [chatTitle, setChatTitle] = useState<string>("");
	const [chatSubtitle, setChatSubtitle] = useState<string>("");
	const [featuresTitle, setFeaturesTitle] = useState<string>("");
	const [featuresSubtitle, setFeaturesSubtitle] = useState<string>("");
	const [features, setFeatures] = useState<Array<{ id?: string; title: string; description: string; icon?: string; order_index?: number; is_active?: boolean }>>([]);
	const [isSaving, setIsSaving] = useState(false);

	const isValid = useMemo(() => !!hero && (hero.title || "").trim().length > 0, [hero]);

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
			const [heroRes, chatbotRes, featuresRes, showcaseRes] = await Promise.all([
				fetch("/api/landing/hero"),
				fetch("/api/landing/chatbot"),
				fetch("/api/landing/features"),
				fetch("/api/landing/showcase")
			]);

			// Handle hero data
			if (heroRes.ok) {
				const heroData = await heroRes.json();
				if (heroData && (heroData.title || heroData.subtitle || heroData.images)) {
					setHero({
						id: 1,
						title: heroData.title || "",
						subtitle: heroData.subtitle || "",
						images: Array.isArray(heroData.images) && heroData.images.length > 0 ? heroData.images : [],
					});
				} else {
					// No data from database, set empty state
					setHero({
						id: 1,
						title: "",
						subtitle: "",
						images: [],
					});
				}
			}

			// Handle showcase images data
			if (showcaseRes.ok) {
				const showcaseData = await showcaseRes.json();
				if (showcaseData && (showcaseData.image1 || showcaseData.image2 || showcaseData.image3)) {
					setShowcaseImages({
						id: 1,
						image1: showcaseData.image1 || "",
						image2: showcaseData.image2 || "",
						image3: showcaseData.image3 || "",
					});
				} else {
					// No data from database, set empty state
					setShowcaseImages({
						id: 1,
						image1: "",
						image2: "",
						image3: "",
					});
				}
			}

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
				} else {
					// No data from database, set empty state
					setFeaturesTitle("");
					setFeaturesSubtitle("");
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
		if (!hero) return;
		setIsSaving(true);
		try {
			const res = await fetch("/api/landing/hero", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(hero),
			});
			if (res.ok) {
				toast.success("Hero section saved successfully!");
			} else {
				toast.error("Failed to save hero section");
			}
		} catch (error) {
			toast.error("An error occurred while saving hero section");
		} finally {
			setIsSaving(false);
		}
	}

	async function saveShowcase() {
		if (!showcaseImages) return;
		setIsSaving(true);
		try {
			const res = await fetch("/api/landing/showcase", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(showcaseImages),
			});
			if (res.ok) {
				toast.success("Showcase images saved successfully!");
			} else {
				toast.error("Failed to save showcase images");
			}
		} catch (error) {
			toast.error("An error occurred while saving showcase images");
		} finally {
			setIsSaving(false);
		}
	}

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
				body: JSON.stringify({ title: featuresTitle, subtitle: featuresSubtitle }) 
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

	function updateShowcaseImage(field: 'image1' | 'image2' | 'image3', value: string) {
		if (!showcaseImages) return;
		setShowcaseImages({ ...showcaseImages, [field]: value });
	}

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

	async function onShowcaseUpload(field: 'image1' | 'image2' | 'image3', file: File) {
		const form = new FormData();
		form.append("file", file);
		form.append("filename", file.name);
		const res = await fetch("/api/landing/upload", { method: "POST", body: form });
		if (res.ok) {
			const data = await res.json();
			if (data?.url) updateShowcaseImage(field, data.url);
		}
	}

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
					{/* Slider image uploaders removed as slider is no longer used */}
					<div>
						<button disabled={!isValid || isSaving} onClick={saveHero} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
							{isSaving ? "Saving..." : "Save"}
						</button>
					</div>
				</div>
			</div>

			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 className="text-lg font-semibold mb-4">Showcase Images Section</h2>
				<p className="text-sm text-gray-600 dark:text-gray-400 mb-4">These 3 images will be displayed before the Key Features section on the landing page.</p>
				<div className="grid gap-4">
					{/* Image 1 */}
					<div className="border rounded p-4 bg-gray-50 dark:bg-gray-700">
						<label className="block text-sm font-medium mb-2">Image 1 (Top Left)</label>
						<div className="flex items-center gap-3">
							{showcaseImages?.image1 && (
								<img src={showcaseImages.image1} alt="Showcase 1" className="h-16 w-24 object-cover rounded border" />
							)}
							<input 
								className="border rounded p-2 flex-1 bg-white dark:bg-gray-900" 
								placeholder="Image URL #1" 
								value={showcaseImages?.image1 || ""} 
								onChange={(e) => updateShowcaseImage('image1', e.target.value)} 
							/>
							<label className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm cursor-pointer">
								<input 
									type="file" 
									accept="image/*" 
									className="hidden" 
									onChange={(e) => { 
										const f = e.target.files?.[0]; 
										if (f) onShowcaseUpload('image1', f); 
									}} 
								/>
								Upload
							</label>
						</div>
					</div>

					{/* Image 2 */}
					<div className="border rounded p-4 bg-gray-50 dark:bg-gray-700">
						<label className="block text-sm font-medium mb-2">Image 2 (Top Right)</label>
						<div className="flex items-center gap-3">
							{showcaseImages?.image2 && (
								<img src={showcaseImages.image2} alt="Showcase 2" className="h-16 w-24 object-cover rounded border" />
							)}
							<input 
								className="border rounded p-2 flex-1 bg-white dark:bg-gray-900" 
								placeholder="Image URL #2" 
								value={showcaseImages?.image2 || ""} 
								onChange={(e) => updateShowcaseImage('image2', e.target.value)} 
							/>
							<label className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm cursor-pointer">
								<input 
									type="file" 
									accept="image/*" 
									className="hidden" 
									onChange={(e) => { 
										const f = e.target.files?.[0]; 
										if (f) onShowcaseUpload('image2', f); 
									}} 
								/>
								Upload
							</label>
						</div>
					</div>

					{/* Image 3 */}
					<div className="border rounded p-4 bg-gray-50 dark:bg-gray-700">
						<label className="block text-sm font-medium mb-2">Image 3 (Bottom Full Width)</label>
						<div className="flex items-center gap-3">
							{showcaseImages?.image3 && (
								<img src={showcaseImages.image3} alt="Showcase 3" className="h-16 w-24 object-cover rounded border" />
							)}
							<input 
								className="border rounded p-2 flex-1 bg-white dark:bg-gray-900" 
								placeholder="Image URL #3" 
								value={showcaseImages?.image3 || ""} 
								onChange={(e) => updateShowcaseImage('image3', e.target.value)} 
							/>
							<label className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm cursor-pointer">
								<input 
									type="file" 
									accept="image/*" 
									className="hidden" 
									onChange={(e) => { 
										const f = e.target.files?.[0]; 
										if (f) onShowcaseUpload('image3', f); 
									}} 
								/>
								Upload
							</label>
						</div>
					</div>

					<div>
						<button disabled={isSaving} onClick={saveShowcase} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
							{isSaving ? "Saving..." : "Save Showcase Images"}
						</button>
					</div>
				</div>
			</div>
			
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 className="text-lg font-semibold mb-4">Key Features Section</h2>
				<div className="grid gap-4">
					<input className="border rounded p-2 bg-white dark:bg-gray-900" placeholder="Features Title" value={featuresTitle} onChange={(e) => setFeaturesTitle(e.target.value)} />
					<textarea className="border rounded p-2 min-h-[100px] bg-white dark:bg-gray-900" placeholder="Features Subtitle" value={featuresSubtitle} onChange={(e) => setFeaturesSubtitle(e.target.value)} />
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


