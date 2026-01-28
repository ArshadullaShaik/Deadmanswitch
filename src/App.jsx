import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_BYTECODE } from './utils/contracts';
import { Wallet, Shield, AlertTriangle, Key, Clock, DollarSign, Activity, LogOut, ArrowRight, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Scene from './components/3d/Scene';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Card = ({ children, className }) => (
  <div className={cn("bg-gray-900/40 border border-emerald-500/20 rounded-xl p-6 shadow-2xl backdrop-blur-md", className)}>
    {children}
  </div>
);

const Input = ({ label, ...props }) => (
  <div className="mb-4">
    <label className="block text-emerald-100/80 text-sm font-medium mb-1">{label}</label>
    <input
      className="w-full bg-black/40 border border-emerald-500/30 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all placeholder-white/20 backdrop-blur-sm"
      {...props}
    />
  </div>
);

const Button = ({ children, variant = 'primary', className, isLoading, ...props }) => {
  const variants = {
    primary: "bg-emerald-600/90 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-sm",
    secondary: "bg-gray-800/60 hover:bg-gray-700/60 text-emerald-100 border border-emerald-500/30 backdrop-blur-sm",
    danger: "bg-rose-600/90 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)] backdrop-blur-sm",
    ghost: "bg-transparent hover:bg-white/10 text-emerald-100/70 hover:text-white"
  };

  return (
    <button
      className={cn(
        "flex items-center justify-center font-bold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
      ) : null}
      {children}
    </button>
  );
};

// --- Main Apps ---

export default function App() {
  const [view, setView] = useState('deploy'); // 'deploy' | 'dashboard'
  const [wallet, setWallet] = useState(null);
  const [contractAddress, setContractAddress] = useState('');
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [contractData, setContractData] = useState({
    balance: '0',
    lastActive: 0,
    duration: 0,
    isActive: false,
    masterKey: '',
    senKey: ''
  });

  // Constructor Inputs
  const [deployParams, setDeployParams] = useState({
    senkey: '',
    masterkey: '',
    beneficiarykey: '',
    email: localStorage.getItem('beneficiary_email') || '',
    password: '',
    withdrawalPassword: ''
  });

  // Persist email to localStorage
  useEffect(() => {
    localStorage.setItem('beneficiary_email', deployParams.email);
  }, [deployParams.email]);

  // Dashboard Inputs
  const [pingDuration, setPingDuration] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [claimPassword, setClaimPassword] = useState('');
  const [manualAddress, setManualAddress] = useState('');

  // Connect Wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error("No crypto wallet found. Please install MetaMask.");

      // Request network switch to Sepolia
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }], // Sepolia Chain ID
        });
      } catch (switchError) {
        // This error code 4902 means the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          setError("Please add Sepolia network to MetaMask");
          return;
        }
        // If other error, just log and continue (user might be on a different compatible testnet if they insist)
        console.warn("Could not switch to Sepolia", switchError);
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      setWallet(signer);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  // Deploy Contract
  const handleDeploy = async () => {
    if (!wallet) return connectWallet();
    if (!CONTRACT_BYTECODE) {
      setError("Contract Bytecode is missing in src/utils/contracts.js!");
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const factory = new ethers.ContractFactory(CONTRACT_ABI, CONTRACT_BYTECODE, wallet);
      const contract = await factory.deploy(
        deployParams.senkey,
        deployParams.masterkey,
        deployParams.beneficiarykey,
        deployParams.password,
        deployParams.withdrawalPassword
      );

      const deploymentTx = await contract.waitForDeployment();
      const address = await deploymentTx.getAddress();

      setContractAddress(address);
      setContract(contract);
      setView('dashboard');
    } catch (err) {
      console.error(err);
      setError("Deployment failed: " + (err.reason || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Load Existing Contract
  const loadContract = async () => {
    if (!wallet) return connectWallet();
    if (!ethers.isAddress(manualAddress)) {
      setError("Invalid Ethereum Address");
      return;
    }
    if (wallet && manualAddress.toLowerCase() === wallet.address.toLowerCase()) {
      setError("You cannot load your own wallet address as the contract!");
      return;
    }

    try {
      const contractInstance = new ethers.Contract(manualAddress, CONTRACT_ABI, wallet);
      setContractAddress(manualAddress);
      setContract(contractInstance);
      setView('dashboard');
    } catch (err) {
      setError("Failed to load contract");
    }
  };

  // Fetch Contract Data
  const refreshData = async () => {
    if (!contract) return;
    try {
      const provider = contract.runner.provider;
      const balance = await provider.getBalance(contractAddress);

      // Try to fetch lastactive if it exists
      let lastActive = 0;
      try {
        lastActive = await contract.lastactive();
      } catch (e) {
        console.warn("Could not fetch lastactive", e);
      }

      let mKey = '';
      try {
        mKey = await contract.masterkey();
      } catch (e) {
        console.warn("Could not fetch masterkey", e);
      }

      let sKey = '';
      try {
        sKey = await contract.senkey();
      } catch (e) {
        console.warn("Could not fetch senkey", e);
      }

      setContractData({
        balance: ethers.formatEther(balance),
        lastActive: Number(lastActive),
        isActive: true,
        masterKey: mKey,
        senKey: sKey
      });
    } catch (err) {
      console.error("Data refresh failed:", err);
    }
  };

  useEffect(() => {
    if (view === 'dashboard' && contract) {
      refreshData();
      const interval = setInterval(refreshData, 10000); // Poll every 10s

      // Event Listeners
      const onMoneySecured = (sender, amount) => {
        console.log("Money Secured:", sender, amount);
        refreshData();
      };
      const onWithdraw = (owner, amount) => {
        console.log("Withdraw:", owner, amount);
        refreshData();
      };
      const onReleaseMoney = (owner, amount) => {
        console.log("Release Money:", owner, amount);
        refreshData();
        alert("Beneficiary has claimed the funds!");
      };
      const onExtraTime = (msg) => {
        console.log("Extra Time:", msg);
        refreshData();
      };

      contract.on("moneysecured", onMoneySecured);
      contract.on("withdraw", onWithdraw);
      contract.on("releasemoney", onReleaseMoney);
      contract.on("extratime", onExtraTime);

      return () => {
        clearInterval(interval);
        contract.off("moneysecured", onMoneySecured);
        contract.off("withdraw", onWithdraw);
        contract.off("releasemoney", onReleaseMoney);
        contract.off("extratime", onExtraTime);
      };
    }
  }, [view, contract]);

  // Actions
  const handlePing = async () => {
    if (!contract) return;
    setIsLoading(true);
    try {
      const tx = await contract.ping(pingDuration || 0);
      await tx.wait();
      refreshData();
    } catch (err) {
      setError("Ping failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!contract) return;
    setIsLoading(true);
    try {
      // Assuming 'securemoney' is the function or just sending ETH
      // If there is a receive function, we can just send transaction
      // Based on user snippet 'securemoney', stick to that. 
      // If ABI doesn't match real contract this will fail, user must verify ABI.
      const tx = await contract.securemoney({ value: ethers.parseEther(depositAmount) });
      await tx.wait();
      refreshData();
      setDepositAmount('');
    } catch (err) {
      setError("Deposit failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    console.log("handleWithdraw called");
    if (!contract) {
      console.error("Contract is not locked");
      alert("Contract not loaded!");
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log("Contract Data:", contractData);
      console.log("Wallet:", wallet ? wallet.address : "No wallet");

      // 1. Check Balance
      if (Number(contractData.balance) <= 0) {
        throw new Error("Balance is 0. The contract has no money to withdraw! Did you Deposit?");
      }

      // 2. Validate Sender (Warning)
      const mKey = contractData.masterKey;
      const sKey = contractData.senKey;

      if (wallet && mKey && sKey) {
        const currentAddr = wallet.address.toLowerCase();
        if (currentAddr !== mKey.toLowerCase() && currentAddr !== sKey.toLowerCase()) {
          console.warn("connected wallet is neither Master nor Secondary Key");
          // alert("Warning: You are not connected as the Master or Secondary Key. The contract will likely revert.");
        }
      }

      const pwd = withdrawPassword;
      console.log("Calling withdrawmoneyowner with password:", pwd);

      const tx = await contract.withdrawmoneyowner(pwd);
      console.log("Transaction sent:", tx.hash);

      await tx.wait();
      console.log("Transaction confirmed");

      refreshData();
      alert("Withdrawal Successful!");
    } catch (err) {
      console.error("Withdraw Error:", err);
      // Try to extract a better error message
      let msg = err.reason || err.message || "Unknown error";
      if (err.info && err.info.error && err.info.error.message) {
        msg = err.info.error.message;
      }

      if (msg.includes("Hell NOOOO")) msg = "Invalid Password or Unauthorized Wallet.";
      if (msg.includes("No money left")) msg = "Contract Balance is 0.";

      setError("Withdraw failed: " + msg);
      alert("Withdraw failed: " + msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!contract) return;
    setIsLoading(true);
    try {
      const tx = await contract.userdied(claimPassword);
      await tx.wait();
      refreshData();
    } catch (err) {
      if (err.message.includes("The person is active") || (err.reason && err.reason.includes("The person is active"))) {
        setError("Claim failed: The Vault is still ACTIVE! You must wait for the timer to expire.");
      } else {
        setError("Claim failed: " + (err.reason || err.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render ---

  return (
    <div className="relative min-h-screen text-gray-100 font-sans overflow-hidden">
      {/* 3D Scene Background */}
      <Scene isActive={contractData.isActive} />

      <div className="relative z-10 p-6">
        <header className="max-w-5xl mx-auto flex justify-between items-center mb-10 backdrop-blur-sm bg-black/20 p-4 rounded-full border border-white/5">
          <div className="flex items-center space-x-3">
            <Shield className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              SecureLife Vault
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {contractAddress && (
              <span className="hidden md:block text-base font-mono bg-black/40 px-3 py-1 rounded text-emerald-400/80 border border-emerald-500/20">
                {contractAddress}
              </span>
            )}
            {!wallet ? (
              <Button onClick={connectWallet} variant="secondary"> Connect Wallet </Button>
            ) : (
              <div className="flex items-center space-x-2 text-sm text-emerald-400 bg-emerald-900/20 px-3 py-2 rounded-lg border border-emerald-900/50 backdrop-blur-md">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse box-shadow-[0_0_10px_#10B981]" />
                <span>{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
              </div>
            )}
          </div>
        </header>

        <main className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-6 bg-blue-900/40 border border-blue-500/50 text-blue-200 p-4 rounded-lg flex items-center backdrop-blur-md">
              <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {view === 'deploy' ? (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Deploy New */}
              <Card className="border-emerald-500/30">
                <div className="mb-6 border-b border-gray-700/50 pb-4">
                  <h2 className="text-xl font-bold flex items-center text-white">
                    <Key className="w-5 h-5 mr-2 text-emerald-400" /> Deploy New Vault
                  </h2>
                  <p className="text-emerald-100/60 text-sm mt-1">Create a fresh Dead Man's Switch contract.</p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Secondary Key Address"
                    placeholder="0x..."
                    value={deployParams.senkey}
                    onChange={e => setDeployParams({ ...deployParams, senkey: e.target.value })}
                  />
                  <Input
                    label="Master Key Address"
                    placeholder="0x..."
                    value={deployParams.masterkey}
                    onChange={e => setDeployParams({ ...deployParams, masterkey: e.target.value })}
                  />
                  <Input
                    label="Beneficiary Address"
                    placeholder="0x..."
                    value={deployParams.beneficiarykey}
                    onChange={e => setDeployParams({ ...deployParams, beneficiarykey: e.target.value })}
                  />
                  <Input
                    label="Beneficiary Email"
                    type="email"
                    placeholder="beneficiary@example.com"
                    value={deployParams.email}
                    onChange={e => setDeployParams({ ...deployParams, email: e.target.value })}
                  />
                  <Input
                    label="Secret Password"
                    type="password"
                    placeholder="Correct Horse Battery Staple"
                    value={deployParams.password}
                    onChange={e => setDeployParams({ ...deployParams, password: e.target.value })}
                  />
                  <Input
                    label="Withdrawal Password"
                    type="password"
                    placeholder="Secret for Owner Withdrawal"
                    value={deployParams.withdrawalPassword}
                    onChange={e => setDeployParams({ ...deployParams, withdrawalPassword: e.target.value })}
                  />

                  <Button className="w-full mt-4" onClick={handleDeploy} isLoading={isLoading}>
                    Deploy Contract
                  </Button>
                </div>
              </Card>

              {/* Load Existing */}
              <div className="space-y-6">
                <Card>
                  <h3 className="text-lg font-bold mb-4 flex items-center text-emerald-100">
                    <Activity className="w-5 h-5 mr-2" /> Load Existing
                  </h3>
                  <div className="flex gap-2">
                    <input
                      placeholder="Contract Address (0x...)"
                      className="flex-1 bg-black/40 border border-emerald-500/30 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-400 backdrop-blur-sm"
                      value={manualAddress}
                      onChange={e => setManualAddress(e.target.value)}
                    />
                    <Button variant="secondary" onClick={loadContract}>Load</Button>
                  </div>
                </Card>

                <div className="bg-emerald-900/10 p-6 rounded-xl border border-dashed border-emerald-500/30 text-center backdrop-blur-sm">
                  <h4 className="text-emerald-100/80 font-medium mb-2">How it works</h4>
                  <p className="text-sm text-emerald-100/50">
                    Deploy a contract with a backup key and beneficiary.
                    If you don't "Ping" the contract within the duration, the beneficiary can claim the funds using the password.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-emerald-900/40 to-black/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-emerald-100/60 text-sm font-medium">Vault Balance</span>
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-bold text-white drop-shadow-lg">{contractData.balance} SepoliaETH</div>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900/40 to-black/40 border-blue-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-100/60 text-sm font-medium">Status</span>
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse box-shadow-[0_0_10px_#3B82F6]" />
                    <span className="text-xl font-bold text-blue-100">Active</span>
                  </div>
                  <div className="text-xs text-blue-200/50 mt-1">Last Active: {new Date(contractData.lastActive * 1000).toLocaleString()}</div>
                </Card>
              </div>



              {/* Actions Tabs */}
              <div className="bg-black/40 rounded-xl border border-gray-700/50 overflow-hidden backdrop-blur-md shadow-2xl">
                <div className="border-b border-gray-700/50 flex">
                  <div className="px-6 py-3 border-b-2 border-emerald-500 text-emerald-400 font-medium bg-emerald-900/10">
                    Owner Actions
                  </div>
                  <div className="px-6 py-3 border-b-2 border-transparent text-gray-400 font-medium hover:text-gray-200">
                    Beneficiary Actions
                  </div>
                </div>

                <div className="p-6 grid md:grid-cols-2 gap-8">
                  {/* Owner Column */}
                  <div className="space-y-6 border-r border-gray-700/50 pr-0 md:pr-8">
                    <h3 className="text-lg font-bold text-emerald-100 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-emerald-400" /> Keep Alive
                    </h3>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        placeholder="Duration (seconds)"
                        className="flex-1 bg-black/40 border border-emerald-500/30 rounded-lg p-2 text-white"
                        value={pingDuration}
                        onChange={e => setPingDuration(e.target.value)}
                      />
                      <Button onClick={handlePing} className="py-2 px-4 text-sm">Ping</Button>
                    </div>

                    <hr className="border-gray-700/50" />

                    <h3 className="text-lg font-bold text-emerald-100 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-emerald-400" /> Deposit Funds
                    </h3>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        placeholder="Amount (SepoliaETH)"
                        className="flex-1 bg-black/40 border border-emerald-500/30 rounded-lg p-2 text-white"
                        value={depositAmount}
                        onChange={e => setDepositAmount(e.target.value)}
                      />
                      <Button onClick={handleDeposit} className="py-2 px-4 text-sm">Secure Funds</Button>
                    </div>

                    <hr className="border-gray-700/50" />

                    <h3 className="text-lg font-bold text-rose-200 flex items-center">
                      <LogOut className="w-5 h-5 mr-2 text-rose-500" /> Emergency
                    </h3>
                    <div className="flex gap-3">
                      <input
                        type="password"
                        placeholder="Enter Withdrawal Password"
                        className="flex-1 bg-black/40 border border-rose-500/30 rounded-lg p-2 text-white"
                        value={withdrawPassword}
                        onChange={e => setWithdrawPassword(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-3 mt-2">
                      <Button onClick={handleWithdraw} variant="danger" className="py-2 text-sm w-full">Withdraw</Button>
                    </div>
                  </div>

                  {/* Beneficiary Column */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-blue-200 flex items-center">
                      <CheckCircle2 className="w-5 h-5 mr-2 text-blue-400" /> Inheritance
                    </h3>
                    <p className="text-sm text-blue-200/50">
                      If the contract is inactive (Countdown &lt; 0), you can claim the funds using the password.
                    </p>

                    <Input
                      label="Claim Password"
                      type="password"
                      placeholder="Enter secret..."
                      value={claimPassword}
                      onChange={e => setClaimPassword(e.target.value)}
                    />

                    <Button
                      onClick={handleClaim}
                      className="w-full bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                    >
                      Claim Inheritance
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button onClick={() => setView('deploy')} className="text-emerald-500/70 hover:text-emerald-400 text-sm underline transition-colors">
                  Back to Deployment
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
