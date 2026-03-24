import { useState, useEffect } from "react";
import { Loader2, Plus, List as ListIcon, Trash2, X, Check } from "lucide-react";
import { getCustomCategories, createCustomCategory, deleteCustomCategory } from "~/utils/GrievanceService";
import dayjs from "dayjs";

const PREDEFINED_CATEGORIES = [
    { id: "infrastructure", label: "Public Infrastructure", description: "Parks, public buildings, bus stops, community halls" },
    { id: "water_supply", label: "Water Supply", description: "Water shortage, leakage, quality issues, billing" },
    { id: "electricity", label: "Electricity", description: "Power cuts, faulty meters, streetlights, wiring" },
    { id: "roads", label: "Roads & Transport", description: "Potholes, road damage, traffic signals, footpaths" },
    { id: "sanitation", label: "Sanitation", description: "Garbage collection, drainage, sewage, cleanliness" },
    { id: "health", label: "Health Services", description: "Hospitals, clinics, medicines, public health" },
    { id: "education", label: "Education", description: "Schools, angwanwadis, libraries, scholarships" },
    { id: "other", label: "Other Issues", description: "Any other civic issue not listed above" },
];

export default function Team() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newLabel, setNewLabel] = useState("");
    const [newName, setNewName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orgId, setOrgId] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("user_info") || "{}");
        const oId = userData?.organization_id || userData?.org_id;
        setOrgId(oId);

        if (!oId) {
            setLoading(false);
            return;
        }

        const fetchCategories = async () => {
            setLoading(true);
            try {
                const res = await getCustomCategories(oId);
                setCategories(res?.data || []);
            } catch (err) {
                console.error("Failed to load custom categories:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, [refreshTrigger]);

    // Auto-generate snake_case name when label changes
    const handleLabelChange = (e) => {
        const val = e.target.value;
        setNewLabel(val);
        setNewName(val.toLowerCase().replace(/[\s\W]+/g, '_').replace(/_+$/, ''));
    };

    const handleAddPredefined = async (cat) => {
        if (!orgId) return;
        setIsSubmitting(true);
        try {
            await createCustomCategory(orgId, {
                label: cat.label,
                name: cat.id,
                description: cat.description
            });
            setRefreshTrigger((prev) => prev + 1);
        } catch (err) {
            console.error(err);
            alert(err?.detail || "Failed to add predefined category");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newLabel.trim() || !newName.trim() || !orgId) return;

        setIsSubmitting(true);
        try {
            await createCustomCategory(orgId, {
                label: newLabel.trim(),
                name: newName.trim(),
            });
            setIsModalOpen(false);
            setNewLabel("");
            setNewName("");
            setRefreshTrigger((prev) => prev + 1);
        } catch (err) {
            console.error(err);
            alert(err?.detail || "Failed to create category");
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDeleteCategory = async () => {
        if (!orgId || !categoryToDelete) return;
        setIsSubmitting(true);
        try {
            await deleteCustomCategory(orgId, categoryToDelete.id);
            setCategoryToDelete(null);
            setRefreshTrigger((prev) => prev + 1);
        } catch (err) {
            console.error(err);
            alert(err?.detail || "Failed to delete category");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (categoryId, categoryLabel) => {
        setCategoryToDelete({ id: categoryId, label: categoryLabel });
    };

    if (!orgId && !loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-gray-500">Organization context missing.</p>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-49px)] bg-gray-50 dark:bg-[#0d0d0d] overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="p-6 pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Grievance Categories</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Manage the categories available for public issue reporting.
                            </p>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Category
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 p-6 pt-4 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] rounded-lg shadow-sm">

                        {/* List Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* Predefined Categories Section */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                                    Predefined Categories
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {PREDEFINED_CATEGORIES.map((cat) => {
                                        const isAdded = categories.some((c) => c.name === cat.id);
                                        return (
                                            <div key={cat.id} className="border border-gray-200 dark:border-[#333] rounded-lg p-4 flex items-start justify-between bg-white dark:bg-[#111]">
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{cat.label}</h4>
                                                    <p className="text-xs text-gray-500 mt-1">{cat.description}</p>
                                                </div>
                                                <button
                                                    onClick={() => !isAdded && handleAddPredefined(cat)}
                                                    disabled={isAdded || isSubmitting}
                                                    className={`ml-3 flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5
                                                        ${isAdded
                                                            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 cursor-default'
                                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-[#2a2a2a] dark:hover:bg-[#333] dark:text-gray-300'
                                                        }`}
                                                >
                                                    {isAdded ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5" /> Added
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="w-3.5 h-3.5" /> Add
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <hr className="border-gray-100 dark:border-[#222]" />

                            {/* Custom Categories Section */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                                        Active / Custom Categories
                                    </h3>
                                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-[#2a2a2a] px-2 py-1 rounded-full">{categories.length} total</span>
                                </div>
                                {loading ? (
                                    <div className="flex items-center justify-center h-32">
                                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                    </div>
                                ) : categories.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-8 text-gray-400 border border-dashed border-gray-200 dark:border-[#333] rounded-lg">
                                        <ListIcon className="w-8 h-8 mb-2 opacity-50" />
                                        <p className="text-sm">No custom categories enabled yet.</p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-gray-100 dark:divide-[#222] border border-gray-200 dark:border-[#2a2a2a] rounded-lg bg-white dark:bg-[#1a1a1a] overflow-hidden">
                                        {categories.map((cat, idx) => (
                                            <li key={cat.category_id || idx} className="p-4 flex items-start justify-between hover:bg-gray-50 dark:hover:bg-[#161616] transition-colors">
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{cat.label}</h4>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className="text-xs font-mono text-gray-500 bg-gray-100 dark:bg-[#2a2a2a] px-1.5 py-0.5 rounded">
                                                            {cat.name}
                                                        </span>
                                                        {cat.created_at && (
                                                            <span className="text-xs text-gray-400">
                                                                Created {dayjs(cat.created_at).format("MMM D, YYYY")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteClick(cat.category_id || cat._id, cat.label)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                    title="Remove Category"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-md rounded-xl shadow-xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden flex flex-col">
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-[#222] flex items-center justify-between">
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Create New Category</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-[#2a2a2a]"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateCategory} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Display Label <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newLabel}
                                    onChange={handleLabelChange}
                                    placeholder="e.g. Broken Streetlights"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#333] rounded-lg bg-white dark:bg-[#0d0d0d] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 focus:border-gray-400 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Internal Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newName}
                                    readOnly
                                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-[#333] rounded-lg bg-gray-50 dark:bg-[#111] text-gray-500 font-mono cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-400 mt-1.5">
                                    This is auto-generated as a snake_case value for the system.
                                </p>
                            </div>
                            <div className="pt-4 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !newLabel.trim()}
                                    className="px-4 py-2 text-sm font-medium bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Category"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            {categoryToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1a1a1a] w-full max-w-sm rounded-xl shadow-xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden flex flex-col p-6">
                        <div className="flex flex-col items-center text-center">
                            
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Category?</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                Are you sure you want to remove <span className="font-semibold text-gray-900 dark:text-white">"{categoryToDelete.label}"</span>? This action cannot be undone.
                            </p>
                            <div className="w-full flex items-center gap-3">
                                <button
                                    onClick={() => setCategoryToDelete(null)}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 text-sm font-medium border border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222] rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteCategory}
                                    disabled={isSubmitting}
                                    className="flex-1 flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
