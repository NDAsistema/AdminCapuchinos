import { useState } from "react";
import GroupsList from "./GroupsList/GroupsList";
import TypeGroups from "./TypeGroups/TypeGroups";

export default function Groups() {
    const [activeTab, setActiveTab] = useState<'groups' | 'typegroups'>('groups');

    return (
        <div className="col-span-12">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                Modulo Grupos
            </h1>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`px-3 py-1 rounded ${activeTab === 'groups' 
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' 
                            : 'text-gray-600 dark:text-gray-400'}`}
                    >
                        Groups
                    </button>
                    <button
                        onClick={() => setActiveTab('typegroups')}
                        className={`px-3 py-1 rounded ${activeTab === 'typegroups' 
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' 
                            : 'text-gray-600 dark:text-gray-400'}`}
                    >
                        TypeGroups
                    </button>
                </div>

                {activeTab === 'groups' ? (
                    <GroupsList/>
                ) : (   
                    <TypeGroups/>
                )}
            </div>
        </div>
    );
}