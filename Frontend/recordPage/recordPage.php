<?php
require_once '../../Backend/auth_check.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transactions - MyMoney Tracker</title>
    <link rel="icon" type="image/svg+xml" href="../Images/Logo.svg">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="https://unpkg.com/lucide-icons"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/plugins/confirmDate/confirmDate.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/plugins/confirmDate/confirmDate.css">
    
    <link rel="stylesheet" href="recordPage.css">
    
    <!-- Client-side authentication check -->
    <script src="../js/auth-check.js"></script>
    <style>
        input[type=number].no-spin::-webkit-outer-spin-button,
        input[type=number].no-spin::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
    input[type=number].no-spin { appearance: textfield; -moz-appearance: textfield; }
    </style>
</head>
<body class="bg-gray-100">

    <div id="app" class="flex h-screen">

       <!-- ===== 1. Left Sidebar Navigation ===== -->
        <nav class="w-64 bg-white p-6 shadow-lg flex-shrink-0">
            <!-- Logo -->
            <div class="flex items-center space-x-3 mb-10">
                <div class="logo-container w-200 h-200 flex items-center justify-center rounded-full">
                    <a href="../homePage/homePage.php"><img src="../Images/Logo.svg" alt="MyMoney Tracker Logo" class="w-200 h-200"></a>
                </div>
                <span class="text-xl font-bold text-gray-800">My<span class="text-green-600">Money</span> Tracker</span>
            </div>

            <!-- Navigation Links -->
            <ul class="space-y-3">
                <li v-for="item in navItems" :key="item.name">
                    <a @click.prevent="setActiveNav(item.name)"
                       :class="[
                           'flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all',
                           activeNav === item.name
                               ? 'bg-green-100 text-green-700 font-semibold'
                               : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                       ]">
                        <i :data-lucide="item.icon" class="w-5 h-5"></i>
                        <span>{{ item.name }}</span>
                    </a>
                </li>
            </ul>
        </nav>

        <main class="flex-1 p-4 flex flex-col items-center justify-center">

            <div class="w-full max-w-md flex flex-col h-full justify-between">

                <div>
                    <div class="flex bg-white p-1 rounded-xl shadow-sm mb-6">
                        <button
                            v-for="tab in ['Expense', 'Income', 'Transfer']"
                            :key="tab"
                            @click="setTab(tab)"
                            :class="[
                                'flex-1 py-2 text-sm font-medium rounded-lg transition-all',
                                activeTab === tab
                                    ? 'bg-green-100 text-green-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                            ]">
                            {{ tab }}
                        </button>
                    </div>

                    <div class="text-center mb-6">
                        <div class="flex items-baseline justify-center gap-2 text-green-600 mb-2">
                            <span class="text-xl font-medium opacity-60">PHP</span>
                            <span class="text-5xl font-bold tracking-tight">{{ formattedAmount }}</span>
                        </div>
                        <p class="text-gray-400 text-sm tracking-widest uppercase font-medium">General</p>
                    </div>

                    <div class="space-y-3 mb-6">
                        <div class="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <label class="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                {{ activeTab === 'Transfer' ? 'From' : 'Account' }}
                            </label>
                            <select v-model="selectedAccount" class="bg-transparent font-semibold text-gray-700 text-right outline-none cursor-pointer w-full ml-4">
                                <option :value="null" disabled>Select Account</option>
                                <option v-for="account in accounts" :value="account.platformNumber">
                                    {{ account.platform }}
                                </option>
                            </select>
                        </div>

                        <div v-if="activeTab === 'Transfer'" class="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <label class="text-xs font-bold text-gray-400 uppercase tracking-wider">To</label>
                            <select v-model="transferToAccount" class="bg-transparent font-semibold text-gray-700 text-right outline-none cursor-pointer w-full ml-4">
                                <option :value="null" disabled>Select Receiver</option>
                                <option v-for="account in accounts"
                                        :value="account.platformNumber"
                                        :disabled="account.platformNumber === selectedAccount">
                                    {{ account.platform }}
                                </option>
                            </select>
                        </div>

                        <div class="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <label class="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</label>
                            <input v-model="description" type="text" placeholder="Enter description" class="bg-transparent font-semibold text-gray-700 text-right outline-none w-full ml-4"/>
                        </div>

                        <div class="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <label class="text-xs font-bold text-gray-400 uppercase tracking-wider">Date</label>
                            <input id="dateInput" v-model="selectedDate" type="text" placeholder="Select date" class="bg-transparent font-semibold text-gray-700 text-right outline-none w-full ml-4" />
                        </div>
                    </div>

                    <button v-if="activeTab === 'Expense'" @click="executeExpense" class="w-full button button-green mb-4 justify-center py-3 text-lg shadow-lg shadow-green-100">
                        Confirm Expense
                    </button>

                    <button v-if="activeTab === 'Income'" @click="executeIncome" class="w-full button button-green mb-4 justify-center py-3 text-lg shadow-lg shadow-green-100">
                        Confirm Income
                    </button>

                    <button v-if="activeTab === 'Transfer'" @click="executeTransfer" class="w-full button button-green mb-4 justify-center py-3 text-lg shadow-lg shadow-green-100">
                        Confirm Transfer
                    </button>
                </div>

                <div class="grid grid-cols-3 gap-3">
                    <button
                        v-for="key in keypadKeys"
                        :key="key"
                        @click="pressKey(key)"
                        class="bg-white hover:bg-gray-50 text-gray-700 text-lg font-semibold py-3 rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center">
                        {{ key }}
                    </button>
                </div>

            </div>
        </main>

        <aside class="w-65 bg-white p-9 shadow-lg flex-shrink-0 hidden lg:block overflow-y-auto">
            <div class="flex justify-between items-center mb-3">
                <h2 class="text-xl font-semibold text-gray-800">My Accounts</h2>
            </div>
            <div class="flex justify-between items-center mb-4">
                <button @click="openAddAccount" class="text-sm text-green-600 font-medium hover:text-green-700 transition">+ Add Accounts</button>
            </div>
            

            <div class="space-y-10">
                <div v-for="account in accounts" :key="account.platformNumber" 
                     @click="selectAccountForRemove(account.platformNumber)"
                     :class="['p-5 border rounded-xl hover:shadow-md transition-shadow cursor-pointer', 
                              selectedForRemove === account.platformNumber ? 'border-red-300 bg-red-50' : 'border-gray-100']">
                    <div class="flex justify-between items-start mb-2">
                        <span class="font-bold text-gray-800">{{ account.platform }}</span>
                        <i data-lucide="wallet" class="w-5 h-5 text-gray-400"></i>
                    </div>
                    <div class="flex justify-between items-end">
                        <div>
                            <span class="text-xs text-gray-400 block">Balance</span>
                            <span class="text-lg font-bold text-green-600">₱ {{ formatCurrency(account.availableAssets) }}</span>
                        </div>
                    </div>
                    <button v-if="selectedForRemove === account.platformNumber" 
                            @click.stop="openRemoveAccountModal(account.platformNumber, account.platform)" 
                            class="mt-3 text-sm text-white bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition w-full">Remove</button>
                </div>
            </div>
</aside>

        <!-- Add Account Modal (inside #app) -->
        <div v-cloak v-if="showAddAccount" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div class="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
                <h3 class="text-lg font-semibold mb-4">Add New Account</h3>

                <div class="space-y-3">
                    <div>
                        <label class="block text-sm text-gray-600">Account Name</label>
                        <input v-model="newAccount.platform" type="text" class="w-full mt-1 p-2 border rounded" />
                    </div>

                    <div>
                        <label class="block text-sm text-gray-600">Account Type</label>
                        <select v-model="newAccount.accountType" class="w-full mt-1 p-2 border rounded">
                            <option value="">Select type</option>
                            <option>Cash</option>
                            <option>Bank</option>
                            <option>e-Wallet</option>
                            <option>Credit</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm text-gray-600">Initial Assets</label>
                        <input v-model.number="newAccount.availableAssets" type="number" step="0.01" class="w-full no-spin mt-1 p-2 border rounded" />
                    </div>
                </div>

                <div class="flex justify-end gap-2 mt-6">
                    <button @click="closeAddAccount" class="px-4 py-2 rounded bg-gray-100">Cancel</button>
                    <button @click="saveNewAccount" class="px-4 py-2 rounded bg-green-600 text-white">Save</button>
                </div>
            </div>
        </div>

        <!-- Remove Account Confirmation Modal -->
        <div v-if="showRemoveAccountModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div class="bg-white rounded-lg w-full max-w-sm p-6 shadow-lg">
                <h3 class="text-lg font-semibold mb-2">Confirm Account Removal</h3>
                <p class="text-sm text-gray-700 mb-4">Are you sure you want to remove <strong>{{ removeAccountName }}</strong>? This action cannot be undone.</p>
                <div class="flex justify-end gap-2 mt-6">
                    <button @click="closeRemoveAccountModal" class="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 transition">Cancel</button>
                    <button @click="confirmRemoveAccount" class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition">Remove</button>
                </div>
            </div>
        </div>

    </div>

    <script src="recordPage.js"></script>
</body>
</html>