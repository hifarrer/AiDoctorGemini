"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

interface LandingHero {
	id: number;
	title: string;
	subtitle: string | null;
	images: string[];
}

export default function AdminLandingPage() {
	const defaultTitle = "Your Personal AI Health Assistant";
	const defaultSubtitle = "Get instant, reliable answers to your medical questions. AI Doctor understands both text and images to provide you with the best possible assistance.";
	const defaultImages = ["/images/aidoc1.png","/images/aidoc2.png","/images/aidoc3.png","/images/aidoc4.png"];
	const makeDefaultHero = (): LandingHero => ({ id: 1, title: defaultTitle, subtitle: defaultSubtitle, images: defaultImages });

	const [hero, setHero] = useState<LandingHero | null>(null);
	const [loading, setLoading] = useState(true);
	const [chatTitle, setChatTitle] = useState<string>("");
	const [chatSubtitle, setChatSubtitle] = useState<string>("");
	const [featuresTitle, setFeaturesTitle] = useState<string>("");
	const [featuresSubtitle, setFeaturesSubtitle] = useState<string>("");
	const [features, setFeatures] = useState<Array<{ id?: string; title: string; description: string; icon?: string; order_index?: number; is_active?: boolean }>>([]);
	const [isSaving, setIsSaving] = useState(false);

	const isValid = useMemo(() => !!hero && (hero.title || "").trim().length > 0 && Array.isArray(hero.images) && hero.images.length >= 1, [hero]);

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
			const [heroRes, chatbotRes, featuresRes] = await Promise.all([
				fetch("/api/landing/hero"),
				fetch("/api/landing/chatbot"),
				fetch("/api/landing/features")
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
					setHero(makeDefaultHero());
				}
			}

			// Handle chatbot data
			if (chatbotRes.ok) {
				const chatbotData = await chatbotRes.json();
				if (chatbotData && (chatbotData.title || chatbotData.subtitle)) {
					setChatTitle(chatbotData.title || "");
					setChatSubtitle(chatbotData.subtitle || "");
				} else {
					setChatTitle("Try AI Doctor Now");
					setChatSubtitle("Ask a question below to test the chatbot's capabilities. No registration required.");
				}
			}

			// Handle features data
			if (featuresRes.ok) {
				const featuresData = await featuresRes.json();
				if (featuresData?.section) {
					setFeaturesTitle(featuresData.section.title || "Your Personal Health Companion");
					setFeaturesSubtitle(typeof featuresData.section.subtitle === 'string' ? featuresData.section.subtitle : "Providing intelligent, secure, and accessible health information right at your fingertips.");
				} else {
					setFeaturesTitle("Your Personal Health Companion");
					setFeaturesSubtitle("Providing intelligent, secure, and accessible health information right at your fingertips.");
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
					<div>
						<div className="flex items-center justify-between mb-2">
							<h3 className="font-medium">Slider Images</h3>
							<button onClick={addImage} className="px-3 py-1 rounded bg-teal-500 text-white">Add</button>
						</div>
						<div className="space-y-2">
							{hero?.images?.map((img, idx) => (
								<div key={idx} className="flex items-center gap-3">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img src={img || "/placeholder.svg"} alt={`Slide ${idx+1}`} className="h-16 w-24 object-cover rounded border" />
									<input className="border rounded p-2 flex-1 bg-white dark:bg-gray-900" placeholder={`Image URL #${idx+1}`} value={img} onChange={(e) => updateImage(idx, e.target.value)} />
									<label className="px-3 py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm cursor-pointer">
										<input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(idx, f); }} />
										Upload
									</label>
									<button onClick={() => removeImage(idx)} className="px-3 py-2 rounded bg-red-600 text-white">Remove</button>
								</div>
							))}
						</div>
					</div>
					<div>
						<button disabled={!isValid || isSaving} onClick={saveHero} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
							{isSaving ? "Saving..." : "Save"}
						</button>
					</div>
				</div>
			</div>
			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 className="text-lg font-semibold mb-4">Chatbot Section</h2>
				<div className="grid gap-4">
					<input className="border rounded p-2 bg-white dark:bg-gray-900" placeholder="Chatbot Title" value={chatTitle} onChange={(e) => setChatTitle(e.target.value)} />
					<textarea className="border rounded p-2 min-h-[100px] bg-white dark:bg-gray-900" placeholder="Chatbot Subtitle" value={chatSubtitle} onChange={(e) => setChatSubtitle(e.target.value)} />
					<div>
						<button disabled={isSaving} onClick={saveChatbot} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
							{isSaving ? "Saving..." : "Save"}
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


