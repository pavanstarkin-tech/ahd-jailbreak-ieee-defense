"""
Push AHD-Jailbreak Model and Metadata to Hugging Face Model Hub.
Usage:
  python scripts/push_to_hub.py --repo-id ahd-security/ahd-jailbreak-v1 --token $HF_TOKEN
"""

import os
import argparse
from huggingface_hub import HfApi, create_repo


def push_to_hub(repo_id: str, token: str, private: bool = False):
    print(f"Creating or verifying repository: {repo_id}...")
    create_repo(repo_id=repo_id, token=token, repo_type="model", private=private, exist_ok=True)

    api = HfApi()
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    print(f"Uploading files from {repo_root} to Hugging Face Hub...")
    api.upload_folder(
        folder_path=repo_root,
        repo_id=repo_id,
        repo_type="model",
        token=token,
        ignore_patterns=[
            ".git*",
            "__pycache__/*",
            "*.pyc",
            "quarantine_buffer.db*",
            ".pytest_cache/*",
            "venv/*"
        ]
    )

    print(f"Successfully pushed AHD-Jailbreak to: https://huggingface.co/{repo_id}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-id", default="ahd-security/ahd-jailbreak-v1", help="Target Hugging Face repo ID")
    parser.add_argument("--token", default=os.getenv("HF_TOKEN"), help="Hugging Face API token")
    parser.add_argument("--private", action="store_true", help="Set repository to private")
    args = parser.parse_args()

    if not args.token:
        print("Error: HF_TOKEN environment variable or --token argument is required.")
        exit(1)

    push_to_hub(args.repo_id, args.token, args.private)
