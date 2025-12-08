<?php
require_once '../../Backend/auth_check.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyMoney Tracker Transactions</title>
    <link rel="icon" type="image/svg+xml" href="../Images/Logo.svg">
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://unpkg.com/lucide-icons"></script>
    <link rel="stylesheet" href="transactionPage.css">
    
    <!-- Client-side authentication check -->
    <script src="../js/auth-check.js"></script>

    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'primary-green': '#598d47',
                        'dark-green': '#385d2c',
                    }
                }
            }
        }
    </script>
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

        <!-- LEFT SIDEBAR NAV -->
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
        
        <!-- MAIN CONTENT -->
        <main class="flex-1 p-8 overflow-y-auto">
            <h1 class="text-3xl font-bold text-gray-800 mb-8">Transactions Overview</h1>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <!-- This Month's Income -->
                <div class="bg-white p-6 rounded-lg shadow-sm">
                    <span class="text-gray-500 text-sm">This Month's Income</span>
                    <div class="flex items-center justify-between mt-2 w-full">
                        <span class="font-bold text-gray-800 text-[clamp(0.75rem, 6vw, 2.5rem)] leading-tight">
                            {{ formatCurrency(totalIncome) }}
                        </span>
                    </div>
                </div>
                <!-- This Month's Expense -->
                <div class="bg-white p-6 rounded-lg shadow-sm">
                    <span class="text-gray-500 text-sm">This Month's Expense</span>
                    <div class="flex items-center justify-between mt-2 w-full">
                        <span class="font-bold text-gray-800 text-[clamp(0.75rem, 6vw, 2.5rem)] leading-tight">
                            {{ formatCurrency(totalExpense) }}
                        </span>
                    </div>
                </div>
                <!-- Transfers this month -->
                <div class="bg-white p-6 rounded-lg shadow-sm">
                    <span class="text-gray-500 text-sm">Transfers this month</span>
                    <div class="flex items-center justify-between mt-2 w-full">
                        <span class="font-bold text-gray-800 text-[clamp(0.75rem, 6vw, 2.5rem)] leading-tight">
                            {{ formatCurrency(totalTransfer) }}
                        </span>
                    </div>
                </div>
            </div>

            <div class="bg-white p-6 rounded-lg shadow-sm">
                <!-- Tabs -->
                <div class="flex border-b border-gray-200 mb-6">
                    <button
                        v-for="tab in tabs"
                        :key="tab.key"
                        @click="activeTab = tab.key"
                        :class="[
                            'px-4 py-2 text-base font-medium transition-colors',
                            activeTab === tab.key 
                                ? 'border-b-2 border-green-600 text-green-700' 
                                : 'text-gray-500 hover:text-gray-700'
                        ]"
                    >
                        {{ tab.label }}
                    </button>
                </div>
                
                <!-- Filter and Add Record Button -->
                <div class="flex justify-between items-center mb-4">
                    <div class="flex space-x-4 items-center">
                        <span class="font-semibold text-gray-700">Filter by:</span>
                        <select v-model="filterAccount" class="p-2 border border-gray-300 rounded-lg text-sm">
                            <option value="">All Accounts</option>
                            <option v-for="acc in accounts" :key="acc.platformNumber" :value="acc.platform">{{ acc.platform }}</option>
                        </select>
                        <select v-model="filterMonth" class="p-2 border border-gray-300 rounded-lg text-sm">
                            <option value="">All Months</option>
                            <option v-for="month in availableMonths" :key="month" :value="month">{{ month }}</option>
                        </select>
                    </div>
                    <button @click="goToRecordPage" class="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
                        <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                        + Add Record
                    </button>
                </div>
                <!-- Add Record modal removed; button now navigates to the record page -->

                <!-- Expense Tab -->
                <div v-if="activeTab === 'expense'">
                    <div v-if="filteredExpenseTransactions.length === 0" class="text-center text-gray-400 py-8">
                        No expense records yet.
                    </div>
                    <div v-for="(tx, index) in filteredExpenseTransactions" :key="tx.id"
                        @click="selectedTransaction = (selectedTransaction === tx.id ? null : tx.id)"
                        :class="['grid grid-cols-12 gap-4 items-center bg-gray-50 p-4 rounded-lg hover:shadow-sm transition', selectedTransaction === tx.id ? 'border border-red-200 bg-red-50' : '']">
                        <div class="col-span-4 flex items-center space-x-3">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center bg-red-100">
                                <i data-lucide="shopping-cart" class="w-4 h-4 text-red-600"></i>
                            </div>
                            <span class="font-medium text-gray-800">{{ tx.description }}</span>
                        </div>
                        <div class="col-span-2 hidden sm:block text-sm text-gray-600">{{ tx.account }}</div>
                        <div class="col-span-2 hidden sm:block text-sm text-gray-500">{{ tx.tx_datetime ? tx.tx_datetime.split(' ')[0] : tx.date }}</div>
                        <div class="col-span-2 text-right font-semibold text-red-600">{{ tx.amount }}</div>
                        <div class="col-span-2 text-right hidden sm:block">
                            <button v-if="selectedTransaction === tx.id" @click.stop="openRemoveTransactionModal(tx.id, tx.description)" class="text-sm text-white bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition">Remove</button>
                        </div>
                    </div>
                </div>
                <!-- Income Tab -->
                <div v-else-if="activeTab === 'income'">
                    <div v-if="filteredIncomeTransactions.length === 0" class="text-center text-gray-400 py-8">
                        No income records yet.
                    </div>
                    <div v-for="(tx, index) in filteredIncomeTransactions" :key="tx.id"
                        @click="selectedTransaction = (selectedTransaction === tx.id ? null : tx.id)"
                        :class="['grid grid-cols-12 gap-4 items-center bg-gray-50 p-4 rounded-lg hover:shadow-sm transition', selectedTransaction === tx.id ? 'border border-red-200 bg-red-50' : '']">
                        <div class="col-span-4 flex items-center space-x-3">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center bg-green-100">
                                <i data-lucide="banknote" class="w-4 h-4 text-green-600"></i>
                            </div>
                            <span class="font-medium text-gray-800">{{ tx.description }}</span>
                        </div>
                        <div class="col-span-2 hidden sm:block text-sm text-gray-600">{{ tx.account }}</div>
                        <div class="col-span-2 hidden sm:block text-sm text-gray-500">{{ tx.tx_datetime ? tx.tx_datetime.split(' ')[0] : tx.date }}</div>
                        <div class="col-span-2 text-right font-semibold text-green-600">{{ tx.amount }}</div>
                        <div class="col-span-2 text-right hidden sm:block">
                            <button v-if="selectedTransaction === tx.id" @click.stop="openRemoveTransactionModal(tx.id, tx.description)" class="text-sm text-white bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition">Remove</button>
                        </div>
                    </div>
                </div>
                <!-- Transfer Tab -->
                <div v-else-if="activeTab === 'transfer'">
                    <div v-if="filteredTransferTransactions.length === 0" class="text-center text-gray-400 py-8">
                        No transfer records yet.
                    </div>
                    <div v-for="(tx, index) in filteredTransferTransactions" :key="tx.id"
                        @click="selectedTransaction = (selectedTransaction === tx.id ? null : tx.id)"
                        :class="['grid grid-cols-12 gap-4 items-center bg-gray-50 p-4 rounded-lg hover:shadow-sm transition', selectedTransaction === tx.id ? 'border border-red-200 bg-red-50' : '']">
                        <div class="col-span-4 flex items-center space-x-3">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100">
                                <i data-lucide="arrow-right-left" class="w-4 h-4 text-blue-600"></i>
                            </div>
                            <span class="font-medium text-gray-800">{{ tx.description }}</span>
                            <span class="ml-2 text-xs text-gray-400">({{ tx.account_from }} → {{ tx.account_to }})</span>
                        </div>
                        <div class="col-span-2 hidden sm:block text-sm text-gray-600">{{ tx.account_from }} → {{ tx.account_to }}</div>
                        <div class="col-span-2 hidden sm:block text-sm text-gray-500">{{ tx.tx_datetime ? tx.tx_datetime.split(' ')[0] : tx.date }}</div>
                        <div class="col-span-2 text-right font-semibold text-blue-600">{{ tx.amount }}</div>
                        <div class="col-span-2 text-right hidden sm:block">
                            <button v-if="selectedTransaction === tx.id" @click.stop="openRemoveTransactionModal(tx.id, tx.description)" class="text-sm text-white bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition">Remove</button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
        
        <!-- RIGHT SIDEBAR - MY ACCOUNTS -->
        <aside class="w-65 bg-white p-8 shadow-lg flex-shrink-0 hidden lg:block">
            <div class="flex justify-between items-center mb-3">
                <h2 class="text-xl font-semibold text-gray-800">My Accounts</h2>
            </div>
            <div class="flex justify-between items-center mb-4">
                <button @click="openAddAccount" class="text-sm text-green-600 font-medium hover:text-green-700 transition">+ Add Accounts</button>
            </div>
            <div class="space-y-4">
                <div v-for="account in accounts" :key="account.platformNumber" 
                     @click="selectAccount(account.platformNumber)"
                     :class="['p-5 border rounded-xl hover:shadow-md transition-shadow cursor-pointer', 
                              selectedAccount === account.platformNumber ? 'border-red-300 bg-red-50' : 'border-gray-100']">
                    <div class="flex justify-between items-start mb-2">
                        <span class="font-bold text-gray-800">{{ account.platform }}</span>
                        <i data-lucide="wallet" class="w-5 h-5 text-gray-400"></i>
                    </div>
                    <div class="flex justify-between items-end">
                        <div>
                            <span class="text-xs text-gray-400 block">Balance</span>
                            <span class="text-lg font-bold text-green-600">{{ formatCurrency(account.availableAssets) }}</span>
                        </div>
                    </div>
                    <button v-if="selectedAccount === account.platformNumber" 
                            @click.stop="openRemoveAccountModal(account.platformNumber, account.platform)" 
                            class="mt-3 text-sm text-white bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition w-full">Remove</button>
                </div>
            </div>
        </aside>

        <!-- Add Account Modal (inside #app so Vue can bind) -->
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

        <!-- Remove Transaction Confirmation Modal -->
        <div v-if="showRemoveTransactionModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div class="bg-white rounded-lg w-full max-w-sm p-6 shadow-lg">
                <h3 class="text-lg font-semibold mb-2">Confirm Transaction Removal</h3>
                <p class="text-sm text-gray-700 mb-4">Are you sure you want to remove the transaction <strong>{{ removeTransactionLabel }}</strong>? This action cannot be undone and will adjust account balances.</p>
                <div class="flex justify-end gap-2 mt-6">
                    <button @click="closeRemoveTransactionModal" class="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 transition">Cancel</button>
                    <button @click="confirmRemoveTransaction" class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition">Remove</button>
                </div>
            </div>
        </div>
    </div>

    <script src="transactionPage.js"></script>
</body>
</html>