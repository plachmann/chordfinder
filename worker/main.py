import sys
import json

def main():
    print(json.dumps({"status": "ready"}), flush=True)
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        print(json.dumps({"type": "status", "state": "processing"}), flush=True)

if __name__ == "__main__":
    main()
