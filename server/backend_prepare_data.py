# File: backend_prepare_data.py
# data preparation of Evidente backend
# takes newick, snp and optionally metadata buffers as input
# creates all necessary data for visualization
# Written by Sophie Pesch 2021

import tempfile
import subprocess
import csv
import os
import re
from typing import Tuple
from flask import request, jsonify
import numpy as np
# Use path of this script to detect related executables
ScriptDir = os.path.dirname(os.path.realpath(__file__))


def read_file_content() -> Tuple[str, str, str, str]:
    """Reads contents of newick, snp and taxainfo files.

    Raises value error if newick or snp file is missing or taxainfo file has
    the wrong format.

    Returns:
       newick, snp, metadata-string, metadata-separator
       :rtype: str
    """

    if request.method != 'POST':
        raise ValueError("unexpected method type")
    # check if the post request has the nwk part
    if 'nwk' not in request.files:
        raise ValueError("no nwk part")
    nwk = request.files['nwk']
    # if user does not select file, browser also
    # submit an empty part without filename
    if nwk.filename == '':
        raise ValueError("no nwk file")
    nwk_data = nwk.read()

    # check if the post request has the snp part
    if 'snp' not in request.files:
        raise ValueError("no snp part")
    snp = request.files['snp']

    # if user does not select file, browser also
    # submit an empty part without filename
    if snp.filename == '':
        raise ValueError("no snp file")
    snp_data = snp.read()

    taxainfo_data = ""
    taxainfo_sep = ','
    # check if the post request has the taxainfo part
    if 'taxainfo' in request.files:
        taxainfo = request.files['taxainfo']
        if taxainfo != '':
            taxainfo_data = taxainfo.read()
        if taxainfo.mimetype == "text/tab-separated-values":
            taxainfo_sep = '\t'
        elif taxainfo.mimetype != "text/csv" \
                and taxainfo.mimetype != "application/octet-stream":
            raise ValueError("unexpected taxainfo file type ",
                             taxainfo.mimetype)

    return nwk_data, snp_data, taxainfo_data, taxainfo_sep



# noinspection SpellCheckingInspection,SpellCheckingInspection
def prepare_data(nwk, snp, taxainfo, taxainfo_sep) -> str:
    """Prepares data and returns json result.

    Calls CLASSICO and uses output to create ids and snp parts of result buffer.
    Prepares metadata in 'metadataInfo' and 'taxaInfo' part of result buffer.
    Copies newick data to newick part of result buffer and thereby replacing
    special characters with "_".
    :param nwk: newick tree as :type str
    :param snp: snp table as :type str
    :param taxainfo: metadatatable as :type str
    :param taxainfo_sep: metadata separator as :type str
    :rtype json (? str)
    """

    ids = dict()
    metadatainfo = dict()
    taxainfo_mod = []
    support = []
    not_support = []

    with tempfile.TemporaryDirectory() as tmpdir:
        call_classico(tmpdir, nwk, snp)
        # create nmmber <-> label mappings
        # noinspection SpellCheckingInspection,SpellCheckingInspection
        create_number_label_mapping(ids, tmpdir + "/Ergebnis/IDzuordnung.txt")
        # fill support
        # noinspection SpellCheckingInspection
        fill_support(support, tmpdir + "/Ergebnis/supportSplitKeys.txt", ids)
        # fill 'notSupport'
        # noinspection SpellCheckingInspection
        fill_not_support(not_support,
                         tmpdir + "/Ergebnis/notSupportSplitKeys.txt", ids)

    # get available SNPS and SNP per column
    available_snps, snp_per_column = get_snps(support, not_support)
    # fill metaDataInfo and taxainfo_mod:
    get_meta_data(metadatainfo, taxainfo, taxainfo_sep, taxainfo_mod)

    # add {"type":"SNP","extent":["A","C","T","G","N"]} to metadatainfo if
    # not already existing
    metadatainfo.setdefault("SNP", {"type": "SNP",
                                    "extent": ["A", "C", "T", "G", "N"]})

    # prepare data format for response to frontend:
    data = dict()
    data["ids"] = ids
    data["metadataInfo"] = metadatainfo
    data["newick"] = re.sub("[^a-zA-Z0-9.:,()_-]", "_", nwk.decode('UTF-8'))
    data["support"] = support
    data["notSupport"] = not_support
    data["snpPerColumn"] = snp_per_column
    data["availableSNPs"] = available_snps
    data["taxaInfo"] = taxainfo_mod

    # convert data to json and send back to frontend
    return jsonify(data)


# noinspection SpellCheckingInspection
def call_classico(tmpdir, nwk, snp):
    """Calls CLASSICO and stores output in temporary directory.

    Output can be used to fill snp-parts of response buffer.

    :param tmpdir: temporary directory for CLASSICO result as :type str
    :param nwk: newick tree as :type str
    :param nwk: snp table as :type str
    """

    with tempfile.NamedTemporaryFile() as fp_nwk, \
            tempfile.NamedTemporaryFile() as fp_snp:
        fp_nwk.write(nwk)
        fp_snp.write(snp)
        fp_nwk.flush()
        fp_snp.flush()
        subprocess.run(["java", "-jar", ScriptDir + "/main.jar", fp_snp.name,
                        fp_nwk.name, tmpdir])
        # noinspection SpellCheckingInspection
        print(os.listdir(tmpdir + "/Ergebnis"))


def create_number_label_mapping(ids, filename):
    """Uses CLASSICO output to compute number-label and label-number mapping

    :param ids: result-storage as :type dict
    :param filename: location of CLASSICO result - labeling as :type str"""

    num_to_label = dict()
    with open(filename) as tsv:
        for line in csv.reader(tsv, delimiter="\t"):
            num_to_label[line[0]] = re.sub("[^a-zA-Z0-9_-]", "_", line[1])
    label_to_num = {v: k for k, v in num_to_label.items()}
    ids["numToLabel"] = num_to_label
    ids["labToNum"] = label_to_num


def fill_support(support, filename, ids):
    """Uses CLASSICO output to fill support part of result buffer

    :param support: result-storage as :type list
    :param filename: location of CLASSICO result - support as :type str
    :param ids: number-label-mapping as :type dict"""

    with open(filename) as tsv:
        for line in csv.reader(tsv, delimiter="\t"):
            #TODO solve root case (no -> in line)
            node = ids["numToLabel"][line[0].split("->")[1]]
            for pos, allele in re.findall(r"([0-9]+):\[(.)\]", line[2]):
                support.append({"node": node, "pos": pos, "allele": allele})


def fill_not_support(not_support, filename, ids):
    """Uses CLASSICO output to fill notSupport part of result buffer

    :param not_support: result-storage as :type list
    :param filename: location of CLASSICO result - notsupport as :type str
    :param ids: number-label-mapping as :type dict"""

    with open(filename) as tsv:
        for line in csv.reader(tsv, delimiter="\t"):
            node = ids["numToLabel"][line[0].split("->")[1]]
            for pos, allele in re.findall(r"([0-9]+):\[(.)\]", line[2]):
                not_support.append({"node": node, "pos": pos, "allele": allele})


# noinspection SpellCheckingInspection
def get_snps(support, not_support) -> Tuple[list, dict]:
    """Computes availableSNPs and snpPerColumn of result buffer.

    Uses support and notSupport of result buffer

   :param support: support snps as :type list
   :param not_support: notsupport snps as :type list
   :return available_snps, snp_per_column
   :rtype: list, dict
   """

    available_snps = set()
    snp_per_column = dict()
    for snp in support:
        available_snps.add(snp["pos"])
        snp_per_column.setdefault(snp["pos"], set()).add(snp["allele"])
    for snp in not_support:
        available_snps.add(snp["pos"])
        snp_per_column.setdefault(snp["pos"], set()).add(snp["allele"])
    # convert sets to list for jsonifying data in prepare_data()
    snp_per_column = {k: list(v) for k, v in snp_per_column.items()}
    available_snps = list(available_snps)
    return available_snps, snp_per_column


def get_meta_data(metadata_info, taxainfo, taxainfo_sep, taxainfo_mod):
    # noinspection SpellCheckingInspection
    """Parses metadata in 'metadataInfo' and 'taxaInfo' part of result buffer

     Stores data as list of row-dictionaries in 'taxaInfo'.
     Stores dictionary containing type and extent for each column in
    'metadataInfo'.

    :param metadata_info: result-storage as :type dict
    :param taxainfo: metadata as :type str
    :param taxainfo_sep: separator for metadata as :type str
    :param taxainfo_mod: result-storage as :type list
    """

    taxainfo_decode = taxainfo.decode('UTF-8')
    headers = []
    types = []
    columns = []
    # parse data, fill taxainfo_mod and store headers, column-sets and types:
    parse_meta_data(taxainfo_decode, taxainfo_sep, taxainfo_mod, columns,
                    headers, types)
    # compute column ranges:
    compute_column_ranges(types, columns)
    # fill metadataInfo:
    fill_metadata_info(metadata_info, headers, types, columns)


def fill_metadata_info(metadata_info, headers, types, columns):
    """Stores dictionary

    Stores dictionary containing type and extent for each
    column in metadataInfo.

    :param metadata_info: result-storage as :type dict
    :param headers: storage for metadata column headers :type list
    :param types: storage for metadata column types :type list
    :param columns: metadata-table columns as :type list
    """

    col = 0
    for title in headers:
        metadata_info[title] = {"type": types[col].lower(),
                                "extent": list(columns[col])}
        col += 1


def compute_column_ranges(types, columns):
    """Computes column ranges for numerical columns in metadata table.

    Used to fill metadataInfo in result buffer.

    :param types: storage for metadata column types :type list
    :param columns: metadata-table columns as :type list
    """

    col = 0
    for col_type in types:
        if col_type.lower() == "numerical":
            min_val = min(columns[col])
            max_val = max(columns[col])
            columns[col].clear()
            columns[col].add(min_val)
            columns[col].add(max_val)
        col += 1


def insert_in_columns(types, columns, col, value):
    """Helper-function to add a value to its column in columns.

    Converts numerical values into float.
    Used to compute column_ranges and fill metadataInfo.

    :param types: storage for metadata column types :type list
    :param columns: metadata-table columns as :type list
    :param col: column as :type int
    :param value: value to be inserted in col as
    """

    if types[col].lower() == "numerical":
        x = float(value)
    else:
        x = value
    if len(columns) > col:
        columns[col].add(x)
    else:
        columns.append({x})


def parse_meta_data(taxainfo_decode, taxainfo_sep, taxainfo_mod, columns,
                    headers, types):
    # noinspection SpellCheckingInspection
    """Parses metadata as csv or tsv and fills 'taxaInfo' part of result buffer.

    Preparation of headers and types to fill metadataInfo.

    :param taxainfo_decode: metadata utf-8 decoded :type str
    :param taxainfo_sep: seperator for metadata :type str
    :param taxainfo_mod: result-storage for metadata :type list
    :param columns: result-storage for metadata columns :type list
    :param headers: result-storage for metadata column headers :type list
    :param types: result-storage for metadata column types :type list
    """

    row = 0
    for line in csv.reader(taxainfo_decode.split('\n'), delimiter=taxainfo_sep):
        if len(line) > 0:
            if row == 0:
                headers += line
            elif row == 1:
                types += line
            else:
                curr_line = dict()
                col = 0
                for title in headers:
                    if line[col] != "":
                        curr_line[title] = re.sub("[^a-zA-Z0-9._-]", "_",
                                                  line[col])
                        insert_in_columns(types, columns, col, line[col])
                    col += 1
                taxainfo_mod.append(curr_line)
            row += 1



