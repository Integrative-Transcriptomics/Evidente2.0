# File: backend_prepared_examples.py
# data preparation for examples of Evidente
# creates data for example uploading
# Written by Mathias Witte Paz 2022


import os
from typing import Tuple

# Use path of this script to detect related executables
ScriptDir = os.path.dirname(os.path.realpath(__file__))

DATA_NAMES = {
    "lepra": {
        "dir": "Leprosy",
        "nwk": "nwk.nwk",
        "snp": "snvTable.tsv",
        "taxainfo": "metadata.tsv",
        "gff": "annotations.gff",
        "go": "go_ontology.GO",
        "metadata_sep": "\t",
        "gff_sep": "\t",
        "go_sep": "\t"
    },
    "syphilis": {
        "dir": "Syphilis",
        "nwk": "nwk.nwk",
        "snp": "snvTable.tsv",
        "taxainfo": "metadata.csv",
        "gff": "annotations.gff",
        "go": "go_ontology.GO",
        "metadata_sep": ",",
        "gff_sep": "\t",
        "go_sep": "\t"
    },
    "toy": {
        "dir": "MiniExample",
        "nwk": "mini_nwk.nwk",
        "snp": "mini_snp.tsv",
        "taxainfo": "mini_nodeinfo.csv",
        "gff": "mini_gff.csv",
        "go": "mini_go_terms.csv",
        "metadata_sep": ",",
        "gff_sep": ",",
        "go_sep": ","
    }
}


def return_info_examples(example_id) -> Tuple[str, str, str, str, str, str]:
    """Reads contents of example files.

    Depending on the given example_id, returns the parsed files for it.

    Returns:
        nwk_data, snp_data, taxainfo_data, gff_data, go_data, available_snps
        :rtype: str
    """
    dict_dir_files = DATA_NAMES[example_id]
    dir_path = os.path.join(
        ScriptDir,  dict_dir_files["dir"])
    nwk_data = bytes(
        open(os.path.join(dir_path, dict_dir_files["nwk"])).read(), "utf-8")
    snp_data = bytes(
        open(os.path.join(dir_path, dict_dir_files["snp"])).read(), "utf-8")
    taxainfo_data = bytes(
        open(os.path.join(dir_path, dict_dir_files["taxainfo"])).read(), "utf-8")
    gff_data = bytes(
        open(os.path.join(dir_path, dict_dir_files["gff"]), "r").read(), 'utf-8')
    go_data = bytes(
        open(os.path.join(dir_path, dict_dir_files["go"]), "r").read(), 'utf-8')

    return nwk_data, snp_data, taxainfo_data, gff_data, go_data, dict_dir_files["metadata_sep"], dict_dir_files["gff_sep"], dict_dir_files["go_sep"]
