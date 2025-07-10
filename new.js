import { ethers } from 'ethers';
import dotenv from 'dotenv';
import chalk from 'chalk';
import readline from 'readline';
import fs from 'fs';
import figlet from 'figlet';

dotenv.config();

// شبکه‌های پشتیبانی شده
const NETWORKS = {
    SONEIUM: {
        name: 'Soneium',
        chainId: 1868,
        color: chalk.yellow,
        getProvider: (url) => new ethers.JsonRpcProvider(url || process.env.SONEIUM_RPC),
        batchesSupported: false,
    },
    OP: {
        name: 'Optimism',
        chainId: 10,
        color: chalk.red,
        getProvider: (url) => new ethers.JsonRpcProvider(url || process.env.OP_RPC || 'https://mainnet.optimism.io'),
        batchesSupported: true,
    },
    INK: {
        name: 'Ink',
        chainId: 57073,
        color: chalk.blue,
        getProvider: (url) => new ethers.JsonRpcProvider(url || process.env.INK_RPC),
        batchesSupported: false,
    },
    LISK: {
        name: 'Lisk',
        chainId: 1135,
        color: chalk.magenta,
        getProvider: (url) => new ethers.JsonRpcProvider(url || process.env.LISK_RPC || 'https://rpc.api.lisk.com'),
        batchesSupported: false,
    },
    BASE: {
        name: 'Base',
        chainId: 8453,
        color: chalk.cyan,
        getProvider: (url) => new ethers.JsonRpcProvider(url || process.env.BASE_RPC || 'https://mainnet.base.org'),
        batchesSupported: true,
    },
    UNICHAIN: {
        name: 'UniChain',
        chainId: 130,
        color: chalk.green,
        getProvider: (url) => new ethers.JsonRpcProvider(url || process.env.UNICHAIN_RPC),
        batchesSupported: false,
    },
    // شبکه‌های جدید اضافه شده
    MODE: {
        name: 'Mode',
        chainId: 34443,  // Chain ID برای Mode Network
        color: chalk.greenBright,
        getProvider: (url) => new ethers.JsonRpcProvider(url || process.env.MODE_RPC || 'https://mode.drpc.org'),
        batchesSupported: false,
    },
    WORLDCHAIN: {
        name: 'World Chain',
        chainId: 480,  // Chain ID برای World Chain
        color: chalk.blueBright,
        getProvider: (url) => new ethers.JsonRpcProvider(url || process.env.WORLDCHAIN_RPC || 'https://worldchain.drpc.org'),
        batchesSupported: false,
    }
};

class MultiNetworkTransferBot {
    constructor() {
        this.totalTransactions = 250;
        this.microAmount = ethers.parseEther("0.000000001");
        this.selectedNetworks = [];
        this.wallets = [];
        this.selectedWallets = []; // ولت‌های انتخاب شده
        this.activeJobs = 0;
        this.maxConcurrentJobs = 5;
        this.maxRetries = 3;
        this.retryDelay = 5000;
        this.results = {};
        this.walletInfo = {};
        this.providers = {};
    }

    async initialize() {
        console.log(chalk.bold.green(figlet.textSync('Kachal God Mod', {
            font: 'Standard',
            horizontalLayout: 'default',
            verticalLayout: 'default'
        })));

        console.log(chalk.cyan('
🚀 Multi-Network, Multi-Wallet Transfer Bot - https://t.me/ostadkachal 
'));

        // خواندن کلیدهای خصوصی از env
        await this.initializeWallets();

        if (this.wallets.length === 0) {
            console.log(chalk.red('❌ No valid wallet keys found in .env file!'));
            process.exit(1);
        }

        console.log(chalk.green(`✅ Found ${this.wallets.length} wallet(s) in .env file
`));
        await this.showMenu();
    }

    async initializeWallets() {
        // پیدا کردن تمام کلیدهای خصوصی در env
        const privateKeys = [];

        // کلید اصلی
        if (process.env.PRIVATE_KEY) {
            privateKeys.push(process.env.PRIVATE_KEY);
        }

        // کلیدهای اضافی (PRIVATE_KEY_1, PRIVATE_KEY_2, ...)
        for (let i = 1; i <= 10; i++) {
            const key = process.env[`PRIVATE_KEY_${i}`];
            if (key) {
                privateKeys.push(key);
            }
        }

        this.wallets = privateKeys.map((key, index) => ({
            privateKey: key,
            address: new ethers.Wallet(key).address,
            index: index + 1 // شماره والت (از 1 شروع می‌شود)
        }));
    }

    async showMenu() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // اول شبکه‌ها را انتخاب می‌کنیم
        console.log(chalk.yellow('📋 Select network(s) to send transactions:'));
        console.log('1. Soneium');
        console.log('2. Optimism (OP)');
        console.log('3. Ink');
        console.log('4. Lisk');
        console.log('5. Base');
        console.log('6. UniChain');
        console.log('7. Mode');
        console.log('8. World Chain');
        console.log('9. All Networks');
        console.log('10. Exit');

        const networkAnswer = await new Promise(resolve => {
            rl.question('
Enter your choice (1-10): ', resolve);
        });

        switch (networkAnswer) {
            case '1':
                this.selectedNetworks = ['SONEIUM'];
                break;
            case '2':
                this.selectedNetworks = ['OP'];
                break;
            case '3':
                this.selectedNetworks = ['INK'];
                break;
            case '4':
                this.selectedNetworks = ['LISK'];
                break;
            case '5':
                this.selectedNetworks = ['BASE'];
                break;
            case '6':
                this.selectedNetworks = ['UNICHAIN'];
                break;
            case '7':
                this.selectedNetworks = ['MODE'];
                break;
            case '8':
                this.selectedNetworks = ['WORLDCHAIN'];
                break;
            case '9':
                this.selectedNetworks = Object.keys(NETWORKS);
                break;
            case '10':
                console.log(chalk.yellow('Goodbye! 👋'));
                rl.close();
                process.exit(0);
                break;
            default:
                console.log(chalk.red('❌ Invalid choice. Please try again.'));
                rl.close();
                await this.showMenu();
                return;
        }

        // حالا ولت‌ها را انتخاب می‌کنیم
        console.log(chalk.yellow('
📱 Select wallet(s) to use:'));
        
        // نمایش همه ولت‌های موجود
        this.wallets.forEach((wallet, index) => {
            console.log(`${index + 1}. Wallet #${wallet.index}: ${wallet.address}`);
        });
        console.log(`${this.wallets.length + 1}. All Wallets`);
        console.log(`${this.wallets.length + 2}. Back to Network Selection`);

        const walletAnswer = await new Promise(resolve => {
            rl.question('
Enter wallet numbers separated by comma (e.g., 1,3,5) or single choice: ', resolve);
        });

        rl.close();

        // پردازش انتخاب ولت‌ها
        if (walletAnswer === `${this.wallets.length + 1}`) {
            // همه ولت‌ها
            this.selectedWallets = [...this.wallets];
        } else if (walletAnswer === `${this.wallets.length + 2}`) {
            // بازگشت به منوی انتخاب شبکه
            await this.showMenu();
            return;
        } else {
            // پردازش انتخاب‌های چندگانه
            const selectedIndices = walletAnswer.split(',').map(s => parseInt(s.trim()));
            this.selectedWallets = selectedIndices
                .filter(idx => idx >= 1 && idx <= this.wallets.length)
                .map(idx => this.wallets[idx - 1]);

            if (this.selectedWallets.length === 0) {
                console.log(chalk.red('❌ No valid wallets selected. Please try again.'));
                await this.showMenu();
                return;
            }
        }

        console.log(chalk.green(`
✅ Selected ${this.selectedWallets.length} wallet(s) and ${this.selectedNetworks.length} network(s)`));

        // ایجاد و کش کردن provider ها
        await this.initializeProviders();

        // جمع‌آوری اطلاعات ولت‌ها برای همه شبکه‌ها قبل از شروع عملیات
        await this.gatherWalletsInfo();

        // نمایش اطلاعات ولت‌ها برای همه شبکه‌ها
        await this.displayAllWalletsInfo();

        // شروع عملیات اصلی
        await this.executeTransactions();
    }

    async initializeProviders() {
        console.log(chalk.cyan(`
🔌 Initializing network providers...
`));

        for (const networkKey of this.selectedNetworks) {
            const network = NETWORKS[networkKey];
            try {
                // ایجاد provider با تنظیمات مناسب
                const provider = network.getProvider();

                // تنظیم پارامترهای provider برای جلوگیری از خطاهای باندل
                if (!network.batchesSupported) {
                    provider.batches = false;
                    provider.batchStallTime = 0;
                }

                // تست اتصال
                try {
                    await this.retry(() => provider.getNetwork(), `Connect to ${network.name}`);
                    console.log(network.color(`✅ Successfully connected to ${network.name}`));
                    this.providers[networkKey] = provider;
                } catch (e) {
                    console.log(network.color(`⚠️ Could not connect to ${network.name}: ${e.message}`));
                }
            } catch (e) {
                console.log(network.color(`⚠️ Error initializing provider for ${network.name}: ${e.message}`));
            }
        }
    }

    // متد کمکی برای تلاش مجدد
    async retry(fn, operation, maxRetries = this.maxRetries) {
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (err) {
                lastError = err;

                if (attempt < maxRetries) {
                    const delay = this.retryDelay * Math.pow(2, attempt - 1);
                    console.log(chalk.gray(`⚠️ ${operation} failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay/1000}s...`));
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw new Error(`${operation} failed after ${maxRetries} attempts: ${lastError.message}`);
    }

    async gatherWalletsInfo() {
        console.log(chalk.cyan(`
🔍 Gathering information for ${this.selectedWallets.length} selected wallet(s) on ${this.selectedNetworks.length} network(s)...
`));

        // جمع‌آوری اطلاعات فقط برای ولت‌های انتخاب شده
        for (const wallet of this.selectedWallets) {
            this.walletInfo[wallet.index] = {};

            for (const networkKey of this.selectedNetworks) {
                const network = NETWORKS[networkKey];

                // اگر provider در دسترس نیست، رد کن
                if (!this.providers[networkKey]) {
                    this.walletInfo[wallet.index][networkKey] = {
                        error: `Provider not available for ${network.name}`
                    };
                    continue;
                }

                try {
                    const provider = this.providers[networkKey];
                    const signer = new ethers.Wallet(wallet.privateKey, provider);

                    // دریافت اطلاعات حساب با مکانیزم تلاش مجدد
                    const balance = await this.retry(
                        () => provider.getBalance(signer.address),
                        `Get balance for ${network.name}`
                    ).catch(() => null);

                    const nonce = await this.retry(
                        () => provider.getTransactionCount(signer.address, "pending"),
                        `Get nonce for ${network.name}`
                    ).catch(() => null);

                    const feeData = await this.retry(
                        () => provider.getFeeData(),
                        `Get fee data for ${network.name}`
                    ).catch(() => ({ gasPrice: null }));

                    const gasPrice = feeData.gasPrice || ethers.parseUnits('1', 'gwei');
                    const gasLimit = 21000n;
                    const totalGasCost = gasPrice * gasLimit * BigInt(this.totalTransactions);

                    this.walletInfo[wallet.index][networkKey] = {
                        balance,
                        formattedBalance: balance ? ethers.formatEther(balance) : null,
                        nonce,
                        chainId: network.chainId.toString(),
                        gasPrice,
                        formattedGasPrice: ethers.formatUnits(gasPrice, 'gwei'),
                        totalGasCost,
                        formattedTotalGasCost: ethers.formatEther(totalGasCost),
                        hasEnoughBalance: balance ? balance >= totalGasCost + (this.microAmount * BigInt(this.totalTransactions)) : false
                    };

                } catch (e) {
                    console.log(network.color(`⚠️ Error gathering info for ${network.name} with Wallet #${wallet.index}: ${e.message}`));
                    this.walletInfo[wallet.index][networkKey] = { error: e.message };
                }
            }
        }
    }

    async displayAllWalletsInfo() {
        console.log(chalk.cyan('
💰 Selected Wallets Information Summary:
'));

        for (const wallet of this.selectedWallets) {
            const walletIndex = wallet.index;
            console.log(chalk.yellow(`📝 Wallet #${walletIndex} (${wallet.address}):`));

            for (const networkKey in this.walletInfo[walletIndex]) {
                const info = this.walletInfo[walletIndex][networkKey];
                const network = NETWORKS[networkKey];
                const networkColor = network.color;

                if (info.error) {
                    console.log(networkColor(`   ❌ ${network.name}: ${info.error}`));
                    continue;
                }

                console.log(networkColor(`   📊 ${network.name}:`));
                console.log(networkColor(`      Chain ID: ${info.chainId}`));
                console.log(networkColor(`      Balance: ${info.formattedBalance} ETH`));
                console.log(networkColor(`      Nonce: ${info.nonce}`));
                console.log(networkColor(`      Gas Price: ${info.formattedGasPrice} gwei`));
                console.log(networkColor(`      Estimated Gas Cost (${this.totalTransactions} txs): ${info.formattedTotalGasCost} ETH`));

                if (!info.hasEnoughBalance) {
                    console.log(networkColor(`      ⚠️  WARNING: Balance may not be enough for all transactions!`));
                }

                console.log(''); // خط خالی بین شبکه‌ها
            }

            console.log(''); // خط خالی بین ولت‌ها
        }
    }

    async executeTransactions() {
        console.log(chalk.cyan(`
🚀 Starting transactions on ${this.selectedNetworks.length} network(s) with ${this.selectedWallets.length} wallet(s)
`));

        const promises = [];

        // موازی‌سازی بر اساس شبکه و ولت‌های انتخاب شده
        for (const networkKey of this.selectedNetworks) {
            // اگر provider برای این شبکه موجود نیست، رد کن
            if (!this.providers[networkKey]) {
                const network = NETWORKS[networkKey];
                console.log(network.color(`❌ Skipping ${network.name} due to unavailable provider`));
                continue;
            }

            for (const wallet of this.selectedWallets) {
                // اطمینان حاصل می‌کنیم که فقط برای شبکه‌هایی که اطلاعات موفق دارند ادامه می‌دهیم
                if (this.walletInfo[wallet.index]?.[networkKey]?.error) {
                    const network = NETWORKS[networkKey];
                    console.log(network.color(`❌ Skipping ${network.name} for Wallet #${wallet.index} due to previous errors`));
                    continue;
                }

                promises.push(this.processNetworkWallet(networkKey, wallet));

                // اطمینان حاصل می‌کنیم که بیش از تعداد مشخص شده، کارهای همزمان نداریم
                if (promises.length >= this.maxConcurrentJobs) {
                    // منتظر می‌مانیم تا یک کار تمام شود
                    await Promise.race(promises);
                    // حذف موارد تمام شده از لیست
                    for (let i = 0; i < promises.length; i++) {
                        if (promises[i].status === 'fulfilled') {
                            promises.splice(i, 1);
                            i--;
                        }
                    }
                }
            }
        }

        // منتظر می‌مانیم تا همه کارها تمام شوند
        await Promise.allSettled(promises);

        console.log(chalk.green('
✅ All transactions completed!
'));
        this.showFinalReport();
    }

    async processNetworkWallet(networkKey, wallet) {
        const network = NETWORKS[networkKey];
        const networkColor = network.color;

        // اطلاعات قبلاً جمع‌آوری شده را استفاده می‌کنیم
        const walletNetworkInfo = this.walletInfo[wallet.index][networkKey];

        try {
            const provider = this.providers[networkKey];
            const signer = new ethers.Wallet(wallet.privateKey, provider);

            // شروع تراکنش‌ها
            console.log(networkColor(`
⏳ Starting ${this.totalTransactions} transactions on ${network.name} with Wallet #${wallet.index}...
`));

            // دریافت nonce واقعی در زمان اجرا - بسیار مهم!
            let currentNonce = await this.retry(
                () => provider.getTransactionCount(signer.address, "pending"),
                `Get real-time nonce for ${network.name} wallet #${wallet.index}`
            );

            console.log(networkColor(`📊 [${network.name}] [Wallet #${wallet.index}] Starting with nonce: ${currentNonce}`));

            let successCount = 0;
            let failCount = 0;
            let nonceErrors = 0; // شمارش خطاهای nonce

            const startTime = Date.now();

            for (let i = 1; i <= this.totalTransactions; i++) {
                const toAddress = ethers.Wallet.createRandom().address;

                // سه بار تلاش برای هر تراکنش
                let txSuccess = false;
                let lastError = null;
                let attemptCount = 0;

                while (!txSuccess && attemptCount < this.maxRetries) {
                    attemptCount++;
                    try {
                        // ساخت تراکنش
                        const tx = {
                            to: toAddress,
                            value: this.microAmount,
                            gasLimit: 21000n,
                            gasPrice: walletNetworkInfo.gasPrice,
                            nonce: currentNonce,
                        };

                        // ارسال تراکنش
                        const txResponse = await signer.sendTransaction(tx);

                        console.log(networkColor(`✅ [${network.name}] [Wallet #${wallet.index}] [${i}/${this.totalTransactions}] Sent to ${toAddress.slice(0, 10)}... | Hash: ${txResponse.hash.slice(0, 10)}... | Nonce: ${tx.nonce}`));

                        currentNonce++; // افزایش nonce برای تراکنش بعدی
                        successCount++;
                        txSuccess = true;

                    } catch (error) {
                        lastError = error;

                        if (error.message.includes("nonce") ||
                            error.message.includes("NONCE_EXPIRED") ||
                            error.message.includes("already been used") ||
                            error.message.includes("nonce too low")) {

                            nonceErrors++;

                            try {
                                console.log(networkColor(`⚠️ [${network.name}] [Wallet #${wallet.index}] Nonce error detected. Refreshing nonce...`));
                                const newNonce = await provider.getTransactionCount(signer.address, "pending");

                                if (newNonce > currentNonce) {
                                    console.log(networkColor(`🔄 [${network.name}] [Wallet #${wallet.index}] Updating nonce from ${currentNonce} to ${newNonce}`));
                                    currentNonce = newNonce;
                                    // یک تلاش دیگر انجام می‌دهیم
                                    continue;
                                }
                            } catch (nonceError) {
                                console.log(networkColor(`❌ [${network.name}] [Wallet #${wallet.index}] Failed to refresh nonce: ${nonceError.message}`));
                            }
                        } else if (error.message.includes("SERVER_ERROR") || error.message.includes("could not detect network")) {
                            // خطاهای سرور یا شبکه - صبر کنیم و دوباره تلاش کنیم
                            console.log(networkColor(`⚠️ [${network.name}] [Wallet #${wallet.index}] Server error. Waiting before retry...`));
                            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                            continue;
                        }

                        // نمایش خطا فقط در آخرین تلاش
                        if (attemptCount >= this.maxRetries) {
                            console.log(networkColor(`❌ [${network.name}] [Wallet #${wallet.index}] [${i}/${this.totalTransactions}] Failed: ${error.message}`));
                            failCount++;
                        }
                    }
                }

                // اگر همه تلاش‌ها شکست خورد، تراکنش را رد می‌کنیم
                if (!txSuccess) {
                    console.log(networkColor(`❌ [${network.name}] [Wallet #${wallet.index}] [${i}/${this.totalTransactions}] Transaction failed after ${this.maxRetries} attempts`));
                }

                // فاصله زمانی رندوم بین تراکنش‌ها (15 تا 30 ثانیه)
                const delay = Math.floor(Math.random() * (30000 - 15000 + 1) + 15000);
                console.log(networkColor(`⏱️  [Wallet #${wallet.index}] [${network.name}] Waiting ${(delay/1000).toFixed(1)} seconds before next transaction...`));
                await new Promise(resolve => setTimeout(resolve, delay));

                // نمایش پیشرفت
                if (i % 50 === 0 || i === this.totalTransactions) {
                    console.log(networkColor(`
📊 Progress [${network.name}] [Wallet #${wallet.index}]: ${i}/${this.totalTransactions} (${Math.round(i/this.totalTransactions*100)}%)`));
                    console.log(networkColor(`   ✅ Success: ${successCount} | ❌ Failed: ${failCount} | ⚠️ Nonce Errors: ${nonceErrors}
`));
                }
            }

            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000;

            // گزارش نهایی برای این شبکه
            console.log(networkColor(`
📊 ${network.name} Report for Wallet #${wallet.index}:`));
            console.log(networkColor(`   ✅ Successful: ${successCount}`));
            console.log(networkColor(`   ❌ Failed: ${failCount}`));
            console.log(networkColor(`   ⚠️ Nonce Errors: ${nonceErrors}`));
            console.log(networkColor(`   ⏱️  Duration: ${duration.toFixed(2)} seconds`));

            // ذخیره نتیجه برای گزارش نهایی
            this.results[`${networkKey}-${wallet.index}`] = {
                network: network.name,
                wallet: wallet.address,
                walletIndex: wallet.index,
                successCount,
                failCount,
                nonceErrors,
                duration,
                totalTransactions: this.totalTransactions
            };

        } catch (error) {
            console.log(networkColor(`
❌ Fatal error on ${network.name} with Wallet #${wallet.index}: ${error.message}`));

            this.results[`${networkKey}-${wallet.index}`] = {
                network: network.name,
                wallet: wallet.address,
                walletIndex: wallet.index,
                error: error.message,
                successCount: 0,
                failCount: this.totalTransactions,
                nonceErrors: 0,
                duration: 0,
                totalTransactions: this.totalTransactions
            };
        }
    }

    showFinalReport() {
        console.log(chalk.cyan('
📊 FINAL REPORT
'));

        let totalSuccess = 0;
        let totalFail = 0;
        let totalNonceErrors = 0;

        // گروه‌بندی نتایج بر اساس ولت
        const walletResults = {};

        for (const [key, result] of Object.entries(this.results)) {
            const networkKey = key.split('-')[0];
            const walletIndex = result.walletIndex;

            if (!walletResults[walletIndex]) {
                walletResults[walletIndex] = [];
            }

            walletResults[walletIndex].push({
                networkKey,
                ...result
            });

            totalSuccess += result.successCount || 0;
            totalFail += result.failCount || 0;
            totalNonceErrors += result.nonceErrors || 0;
        }

        // نمایش نتایج به صورت گروه‌بندی شده بر اساس ولت
        for (const [walletIndex, results] of Object.entries(walletResults)) {
            console.log(chalk.yellow(`
📝 Wallet #${walletIndex} (${results[0].wallet.substring(0, 10)}...):`));

            let walletTotalSuccess = 0;
            let walletTotalFail = 0;
            let walletTotalNonceErrors = 0;

            for (const result of results) {
                const color = NETWORKS[result.networkKey]?.color || chalk.white;

                console.log(color(`   ${result.network}:`));
                console.log(color(`      ✅ Successful: ${result.successCount || 0}`));
                console.log(color(`      ❌ Failed: ${result.failCount || 0}`));
                if (result.nonceErrors) {
                    console.log(color(`      ⚠️ Nonce Errors: ${result.nonceErrors}`));
                }
                console.log(color(`      ⏱️  Duration: ${result.duration ? result.duration.toFixed(2) : 'N/A'} seconds`));

                walletTotalSuccess += result.successCount || 0;
                walletTotalFail += result.failCount || 0;
                walletTotalNonceErrors += result.nonceErrors || 0;
            }

            console.log(chalk.yellow(`   📊 Wallet #${walletIndex} Summary:`));
            console.log(chalk.green(`      ✅ Total Successful: ${walletTotalSuccess}`));
            console.log(chalk.red(`      ❌ Total Failed: ${walletTotalFail}`));
            console.log(chalk.yellow(`      ⚠️ Total Nonce Errors: ${walletTotalNonceErrors}`));
            console.log(chalk.blue(`      📝 Total Transactions: ${walletTotalSuccess + walletTotalFail}`));
        }

        console.log(chalk.yellow('
📊 Aggregated Results (All Wallets):'));
        console.log(chalk.green(`✅ Total Successful: ${totalSuccess}`));
        console.log(chalk.red(`❌ Total Failed: ${totalFail}`));
        console.log(chalk.yellow(`⚠️ Total Nonce Errors: ${totalNonceErrors}`));
        console.log(chalk.blue(`📝 Total Transactions: ${totalSuccess + totalFail}`));

        // ذخیره گزارش در فایل
        const report = {
            timestamp: new Date().toISOString(),
            results: this.results,
            byWallet: walletResults,
            totals: {
                successful: totalSuccess,
                failed: totalFail,
                nonceErrors: totalNonceErrors,
                total: totalSuccess + totalFail
            }
        };

        fs.writeFileSync(`kachal-god-mod-report-${Date.now()}.json`, JSON.stringify(report, null, 2));
        console.log(chalk.green('
✅ Report saved to file!'));
    }
}

// اجرای بات
const bot = new MultiNetworkTransferBot();
bot.initialize().catch(console.error);
