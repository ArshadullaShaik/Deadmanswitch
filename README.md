# Dead Man's Switch (SecureLife Vault)

A decentralized application (DApp) designed as a fail-safe mechanism for asset inheritance or emergency triggering. Users can deposit funds into a smart contract, which requires regular "check-ins" (pings) from the owner. If the owner fails to ping within a specified timeframe, the logic assumes an emergency or absence, allowing a designated beneficiary to claim the funds.both the owner and the user need a string password to withdraw if a user losses his wallet he can access the smart contract from his backup wallet i.e the 2nd wallet address given by the user while deploying.

The main problem this project is fixing crypto wallets are easily compromised by hackers its better to store crypto on a smartcontract even though the hacker gets the wallet access he couldn't be able to access the funds since the funds are password protected and encrypted using hashing algorithms and if suppose the owner is dead there will be a automatic mail sent to the benefeicary. the mail contains the password and address of the smart contract to access from site (//the email part is still in developing phase).

## 🌟 Features

-   **Smart Contract Vault**: Securely holds ETH/Schells via a Solidity smart contract.
-   **Heartbeat Mechanism**: Owner must call `ping()` to reset the inactivity timer.
-   **Beneficiary Claim**: If the timer expires, the beneficiary address is authorized to withdraw the funds.
-   **Python Watchtower**: An automated script that monitors the contract status and sends email notifications upon expiration.
-   **3D Interactive UI**: Built with React Three Fiber for an immersive "Vault" experience.

## 📋 Requirements

### Frontend & Smart Contract
-   **Node.js** (v18+ recommended)
-   **NPM** (via Node.js)
-   **MetaMask** (or any Web3 provider wallet)
-   **Ethereum/EVM Testnet/Mainnet** access

### Watchtower (Monitoring Service)
-   **Python 3.8+**
-   **SMTP Server** (e.g., Gmail) for email notifications

## 🚀 Getting Started

### 1. Frontend Setup (React + Vite)
The frontend manages contract deployment, deposits, and pings.

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Start Development Server**
    ```bash
    npm run dev
    ```
    Open your browser at `http://localhost:5173`.

3.  **Usage**
    -   Connect your Wallet.
    -   **Deploy** a new Dead Man's Switch contract (configure Beneficiary & Duration).
    -   **Deposit** funds into the vault.
    -   **Ping** regularly to keep the vault locked.

### 2. Watchtower Setup (Python)
The Watchtower script runs independently to monitor your contract and alert the beneficiary.

1.  **Install Python Dependencies**
    You will need `web3` and `python-dotenv`.
    ```bash
    pip install web3 python-dotenv
    ```

2.  **Configure Environment**
    Create a `.env` file in the root directory (based on `wachtower.py` requirements):
    ```env
    # Blockchain Connection
    RPC_URL=https://your-rpc-url-here
    CONTRACT_ADDRESS=0xYourDeployedContractAddress

    # Email Notification Settings
    EMAIL_USER=your-email@gmail.com
    EMAIL_PASS=your-email-app-password
    EMAIL_HOST=smtp.gmail.com
    EMAIL_PORT=587

    # Beneficiary (Optional, can be set via CLI)
    BENEFICIARY_EMAIL=beneficiary@example.com
    ```

3.  **Run the Watchtower**
    ```bash
    python src/wachtower.py
    ```
    *The script will poll the contract every 10 seconds and send an email if the `lastactive` timestamp + timeout indicates expiration.*

## 🛠️ Project Structure

-   `src/App.jsx` - Main React application logic (Wallet connection, Contract interaction).
-   `src/wachtower.py` - Python monitoring script.
-   `src/components/` - React UI components.
-   `src/utils/contracts.js` - ABI and Bytecode for the smart contract.

## 📄 License

MIT

## Website link : deadkey.vercel.app
