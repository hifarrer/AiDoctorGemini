"use client";

import { useState, useEffect } from "react";
import { plans, Plan } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";

export default function PlansManagement() {
  const [plansList, setPlansList] = useState<Plan[]>(plans);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newFeature, setNewFeature] = useState("");

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan({ ...plan });
    setIsEditing(true);
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;

    try {
      const response = await fetch("/api/admin/plans", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingPlan),
      });

      if (response.ok) {
        // Update local state
        setPlansList(prev => 
          prev.map(plan => 
            plan.id === editingPlan.id ? editingPlan : plan
          )
        );
        toast.success("Plan updated successfully!");
        setIsEditing(false);
        setEditingPlan(null);
      } else {
        toast.error("Failed to update plan");
      }
    } catch (error) {
      toast.error("An error occurred while updating plan");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingPlan(null);
    setNewFeature("");
  };

  const handleAddFeature = () => {
    if (!newFeature.trim() || !editingPlan) return;
    
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, newFeature.trim()]
    });
    setNewFeature("");
  };

  const handleRemoveFeature = (index: number) => {
    if (!editingPlan) return;
    
    setEditingPlan({
      ...editingPlan,
      features: editingPlan.features.filter((_, i) => i !== index)
    });
  };

  const togglePlanStatus = async (planId: string) => {
    const plan = plansList.find(p => p.id === planId);
    if (!plan) return;

    const updatedPlan = { ...plan, isActive: !plan.isActive };
    
    try {
      const response = await fetch("/api/admin/plans", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedPlan),
      });

      if (response.ok) {
        setPlansList(prev => 
          prev.map(p => p.id === planId ? updatedPlan : p)
        );
        toast.success(`Plan ${updatedPlan.isActive ? 'activated' : 'deactivated'} successfully!`);
      } else {
        toast.error("Failed to update plan status");
      }
    } catch (error) {
      toast.error("An error occurred while updating plan status");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Plans Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage subscription plans and pricing
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plansList.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${
              plan.isPopular ? 'ring-2 ring-blue-500' : ''
            } ${!plan.isActive ? 'opacity-60' : ''}`}
          >
            {plan.isPopular && (
              <div className="bg-blue-500 text-white text-center py-2 text-sm font-medium">
                Most Popular
              </div>
            )}
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {plan.title}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => togglePlanStatus(plan.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      plan.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <EditIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {plan.description}
              </p>

              <div className="mb-6">
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${plan.monthlyPrice}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">/month</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  ${plan.yearlyPrice}/year (save ${(plan.monthlyPrice * 12 - plan.yearlyPrice).toFixed(2)})
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <CheckIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isEditing && editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Edit Plan: {editingPlan.title}
              </h2>

              <div className="space-y-6">
                <div>
                  <Label htmlFor="title">Plan Title</Label>
                  <Input
                    id="title"
                    value={editingPlan.title}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, title: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editingPlan.description}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, description: e.target.value })
                    }
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="monthlyPrice">Monthly Price ($)</Label>
                    <Input
                      id="monthlyPrice"
                      type="number"
                      step="0.01"
                      value={editingPlan.monthlyPrice}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, monthlyPrice: parseFloat(e.target.value) || 0 })
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="yearlyPrice">Yearly Price ($)</Label>
                    <Input
                      id="yearlyPrice"
                      type="number"
                      step="0.01"
                      value={editingPlan.yearlyPrice}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, yearlyPrice: parseFloat(e.target.value) || 0 })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Features</Label>
                  <div className="mt-2 space-y-2">
                    {editingPlan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                          {feature}
                        </span>
                        <button
                          onClick={() => handleRemoveFeature(index)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 flex space-x-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add new feature..."
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                    />
                    <Button onClick={handleAddFeature} size="sm">
                      Add
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPopular"
                    checked={editingPlan.isPopular || false}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, isPopular: e.target.checked })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="isPopular">Mark as Popular</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSavePlan}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
