"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface FaqItem {
	id: string;
	question: string;
	answer: string;
	order_index: number;
	is_active: boolean;
	updated_at?: string | null;
}

export default function AdminFaqPage() {
	const [faqs, setFaqs] = useState<FaqItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [form, setForm] = useState<Partial<FaqItem>>({ question: "", answer: "", is_active: true, order_index: 0 });
	const isValid = useMemo(() => (form.question || "").trim().length > 0 && (form.answer || "").trim().length > 0, [form]);

	useEffect(() => {
		loadFaqs();
	}, []);

	async function loadFaqs() {
		setLoading(true);
		try {
			const res = await fetch("/api/admin/faq", { cache: "no-store" });
			if (res.ok) {
				const data = await res.json();
				setFaqs(data);
			}
		} finally {
			setLoading(false);
		}
	}

	async function createFaq() {
		if (!isValid) return;
		const res = await fetch("/api/admin/faq", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				question: form.question,
				answer: form.answer,
				is_active: form.is_active,
				order_index: form.order_index,
			}),
		});
		if (res.ok) {
			setForm({ question: "", answer: "", is_active: true, order_index: (faqs[faqs.length - 1]?.order_index ?? 0) + 1 });
			await loadFaqs();
		}
	}

	async function saveFaq(item: FaqItem) {
		const res = await fetch("/api/admin/faq", {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(item),
		});
		if (res.ok) await loadFaqs();
	}

	async function removeFaq(id: string) {
		const res = await fetch(`/api/admin/faq?id=${encodeURIComponent(id)}`, { method: "DELETE" });
		if (res.ok) await loadFaqs();
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white">FAQ Management</h1>
				<Link href="/admin" className="text-sm text-blue-600 hover:underline">Back to Dashboard</Link>
			</div>

			<div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 className="text-lg font-semibold mb-4">Add FAQ</h2>
				<div className="grid gap-3">
					<input className="border rounded p-2 bg-white dark:bg-gray-900" placeholder="Question" value={form.question || ""} onChange={(e) => setForm(f => ({ ...f, question: e.target.value }))} />
					<textarea className="border rounded p-2 min-h-[120px] bg-white dark:bg-gray-900" placeholder="Answer" value={form.answer || ""} onChange={(e) => setForm(f => ({ ...f, answer: e.target.value }))} />
					<div className="flex items-center gap-4">
						<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))} /> Active</label>
						<input type="number" className="border rounded p-2 w-28 bg-white dark:bg-gray-900" placeholder="Order" value={form.order_index ?? 0} onChange={(e) => setForm(f => ({ ...f, order_index: Number(e.target.value) }))} />
						<button disabled={!isValid} onClick={createFaq} className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded disabled:opacity-50">Add</button>
					</div>
				</div>
			</div>

			<div className="bg-white dark:bg-gray-800 rounded-lg shadow">
				<div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
					<h2 className="text-lg font-semibold">FAQs</h2>
				</div>
				<div className="p-6">
					{loading ? (
						<div className="text-gray-500">Loading...</div>
					) : (
						<div className="space-y-4">
							{faqs.map((f) => (
								<div key={f.id} className="border rounded p-4 bg-gray-50 dark:bg-gray-700">
									<input className="border rounded p-2 w-full mb-2 bg-white dark:bg-gray-900" value={f.question} onChange={(e) => setFaqs(prev => prev.map(x => x.id === f.id ? { ...x, question: e.target.value } : x))} />
									<textarea className="border rounded p-2 w-full min-h-[100px] mb-2 bg-white dark:bg-gray-900" value={f.answer} onChange={(e) => setFaqs(prev => prev.map(x => x.id === f.id ? { ...x, answer: e.target.value } : x))} />
									<div className="flex items-center gap-4">
										<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_active} onChange={(e) => setFaqs(prev => prev.map(x => x.id === f.id ? { ...x, is_active: e.target.checked } : x))} /> Active</label>
										<input type="number" className="border rounded p-2 w-24 bg-white dark:bg-gray-900" value={f.order_index} onChange={(e) => setFaqs(prev => prev.map(x => x.id === f.id ? { ...x, order_index: Number(e.target.value) } : x))} />
										<div className="ml-auto flex gap-2">
											<button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={() => saveFaq(f)}>Save</button>
											<button className="px-3 py-2 rounded bg-red-600 text-white" onClick={() => removeFaq(f.id)}>Delete</button>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}


