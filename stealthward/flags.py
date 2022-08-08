import os

DEFAULT_CONFIG_DIR = os.path.join(os.path.expanduser("~"), ".stealthward")
RE_DATA_CONFIG_DIR = os.path.expanduser(os.getenv("WARD_DATA_CONFIG_DIR", DEFAULT_CONFIG_DIR))
SEND_ANONYMOUS_USAGE_STATS = not os.getenv("WARD_SEND_ANONYMOUS_USAGE_STATS", "").strip() == "0"
