import os
from typing import Dict, Any
from ward.config.system import load_file_contents_as_string
from ward.config.yaml_utils import load_yaml_from_text
from ward.flags import RE_DATA_CONFIG_DIR


def read_re_data_config() -> Dict[str, Any]:
    """
    Parses the ReData config file and returns the details.
    """
    config_file = os.path.join(RE_DATA_CONFIG_DIR, 'ward.yml')
    if not os.path.isfile(config_file):
        return {}

    try:
        contents = load_file_contents_as_string(config_file, strip=False)
        yaml_content = load_yaml_from_text(contents)
        return yaml_content
    except Exception as e:
        msg = str(e)
        raise Exception(msg) 