#Kachal God Mod - Multi-Network ETH Transfer Bot


#Overview
Kachal God Mod is a powerful, multi-wallet, multi-network Ethereum transaction automation tool designed for blockchain developers and network interaction testing. This highly optimized bot efficiently sends micro-transactions across multiple EVM-compatible networks in parallel, with robust error handling and detailed reporting capabilities.

#Features
Multi-Network Support: Works simultaneously across Optimism, Base, Soneium, Ink, Lisk, and UniChain networks
Multi-Wallet Integration: Supports multiple wallets from your .env file
Parallel Processing: Processes transactions across networks in parallel for maximum efficiency
Smart Nonce Management: Automatically handles and recovers from nonce-related errors
Robust Error Handling: Implements intelligent retry mechanisms for network issues
Comprehensive Reporting: Provides detailed transaction reports and saves results to JSON
Interactive CLI: User-friendly command-line interface with color-coded outputs
RPC Provider Optimization: Smart handling of RPC provider limitations and batch requests
#Installation
Clone the repository:

```bash
git clone https://github.com/sinak1023/kachal-god-mod.git
cd kachal-god-mod
````

Install dependencies:
```bash
npm install 
```
Create a `.env` file with your private keys and RPC endpoints:
Primary wallet
`PRIVATE_KEY=your_private_key_here`

Additional wallets (optional)
`PRIVATE_KEY_1=another_private_key`

`PRIVATE_KEY_2=yet_another_private_key`

… up to PRIVATE_KEY_10
RPC URLs (required for networks you want to use):
```
SONEIUM_RPC=https://soneium.drpc.org
OP_RPC=https://mainnet.optimism.io
INK_RPC=https://ink.drpc.org
LISK_RPC=https://lisk.drpc.org
BASE_RPC=https://mainnet.base.org
UNICHAIN_RPC=https://unichain.drpc.org
```

run the bot:
```
npm start   
#or_node bot.js
```
