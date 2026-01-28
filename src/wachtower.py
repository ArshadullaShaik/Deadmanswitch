import time
import os
from web3 import Web3
from dotenv import load_dotenv
from email.message import EmailMessage
import smtplib
from datetime import datetime, timezone

import argparse
import sys

# ... imports ...

# Load environment variables
load_dotenv()

# Setup Argument Parser
parser = argparse.ArgumentParser(description="Dead Man's Switch Watchtower")
parser.add_argument("--email", type=str, help="Beneficiary Email Address")
args = parser.parse_args()

# Configuration
RPC_URL = os.getenv("RPC_URL")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")

# Priority: CLI Arg -> .env -> Interactive Input
BENEFICIARY_EMAIL = args.email if args.email else os.getenv("BENEFICIARY_EMAIL")

# Prompt for Beneficiary Email if missing or default
if not BENEFICIARY_EMAIL or "example.com" in BENEFICIARY_EMAIL:
    print("⚠️  Beneficiary Email not found in arguments or .env")
    BENEFICIARY_EMAIL = input("Please enter the Beneficiary Email: ").strip()
    
    # Save to .env (Optional convenience)
    try:
        with open(".env", "a") as f:
            f.write(f"\nBENEFICIARY_EMAIL={BENEFICIARY_EMAIL}")
        print("✅ Saved Beneficiary Email to .env")
    except Exception as e:
        print(f"⚠️ Could not save to .env: {e}")

TIMEOUT_SECONDS = int(os.getenv("TIMEOUT", 300))  # Default 5 mins if not set

# Email Settings
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", 587))
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")

# Minimal ABI matching your contract
ABI = [
    {
        "inputs": [],
        "name": "lastactive",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]

def check_env():
    missing = []
    if not RPC_URL: missing.append("RPC_URL")
    if not CONTRACT_ADDRESS: missing.append("CONTRACT_ADDRESS")
    if not EMAIL_USER: missing.append("EMAIL_USER")
    if not EMAIL_PASS: missing.append("EMAIL_PASS")
    
    if missing:
        print(f"❌ Missing Environment Variables: {', '.join(missing)}")
        print("Please check your .env file")
        return False
    return True

def send_email(subject, body):
    msg = EmailMessage()
    msg["From"] = EMAIL_USER
    msg["To"] = BENEFICIARY_EMAIL
    msg["Subject"] = subject
    msg.set_content(body)

    try:
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASS)
            server.send_message(msg)
        print(f"✅ Email sent to {BENEFICIARY_EMAIL}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")

def watch_contract():
    if not check_env():
        return

    try:
        w3 = Web3(Web3.HTTPProvider(RPC_URL))
        if not w3.is_connected():
            print("❌ Failed to connect to RPC_URL")
            return
            
        contract = w3.eth.contract(address=Web3.to_checksum_address(CONTRACT_ADDRESS), abi=ABI)
        print(f"🕵️ Watchtower active for contract: {CONTRACT_ADDRESS}")
        print(f"⏱️  Timeout configured to: {TIMEOUT_SECONDS} seconds")

        while True:
            try:
                # Call lastactive() from contract
                last_active_timestamp = contract.functions.lastactive().call()
                
                # Calculate expiry
                expiry_timestamp = last_active_timestamp + TIMEOUT_SECONDS
                now_timestamp = int(datetime.now(timezone.utc).timestamp())
                remaining = expiry_timestamp - now_timestamp

                print(f"[{datetime.now().strftime('%H:%M:%S')}] Last Active: {last_active_timestamp}, Remaining: {remaining}s")

                if remaining <= 0:
                    print("🚨 TIMER EXPIRED! Sending notification...")
                    send_email(
                        "🚨 SecureLife Vault: Dead Man's Switch Triggered",
                        f"""
The inactivity period for your SecureLife Vault has expired.

Contract Address: {CONTRACT_ADDRESS}
Last Active: {datetime.fromtimestamp(last_active_timestamp)}
Expired At: {datetime.fromtimestamp(expiry_timestamp)}

The beneficiary can now claim the funds.
"""
                    )
                    print("📧 Notification sent. Exiting.")
                    break

            except Exception as e:
                print(f"⚠️ Error reading contract: {e}")

            time.sleep(10) # Check every 10 seconds

    except Exception as e:
        print(f"❌ Fatal Error: {e}")

if __name__ == "__main__":
    watch_contract()
