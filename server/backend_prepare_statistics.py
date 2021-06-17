# File: backend_prepare_statistics.py
# data preparation for statistical computation of Evidente backend
# takes snp_info and go_data as input
# prepares all necessary data for statistical computation
# Written by Sophie Pesch 2021


import csv
import numpy as np
from typing import Tuple
from flask import request, jsonify



def read_statistic_file_content() -> Tuple[str, str, str, str]:
    """Reads contents of go_term and snpinfo files.

    Raises value error if a file is missing .

    Returns:
       go-term-string,go-separator, snpinfo-string, snpinfo-separator
       :rtype: str
    """

    if request.method != 'POST':
        raise ValueError("unexpected method type")

    snp_info_data = ""
    snp_info_sep = ','
    # check if the post request has the taxainfo part
    if 'snp_info' in request.files:
        snp_info = request.files['snp_info']
        if snp_info != '':
            snp_info_data = snp_info.read()
        if snp_info.mimetype == "text/tab-separated-values":
            snp_info_sep = '\t'
        elif snp_info.mimetype != "text/csv" \
                and snp_info.mimetype != "application/octet-stream":
            raise ValueError("unexpected taxainfofile type ",
                             snp_info.mimetype)

    go_data = ""
    go_sep = '\t'
    # check if the post request has the taxainfo part
    if 'goterm' in request.files:
        goterm = request.files['goterm']
        if goterm != '':
            go_data = goterm.read()
        #TODO check file type
        #TODO handle wrong file uploads, missing file uploads
        #if goterm.mimetype == "text/tab-separated-values":
       #     go_sep = '\t'
        #elif goterm.mimetype != "text/csv" \
         #       and goterm.mimetype != "application/octet-stream":
          #  raise ValueError("unexpected go file type ",
           #                  goterm.mimetype)

    return  go_data, go_sep,snp_info_data, snp_info_sep



def prepare_statistics(snp_info, snp_info_sep, go_terms, go_sep) -> str:
    """Prepares snp_info and go data for statistical computations

    Parses snp_info into dict from pos,allele to gene-id,go-term
    Sends preprocessed snp-info and go data as json to client.

    :param snp_info: snp_info file as :type str
    :param snp_info_sep: separator to parse snp_info as :type str
    :param go_terms: go_term file as :type str
    :param go_sep: separator to parse go file as :type str
    :return: json: json containing snp_with_go as :type dict
    """
    filtered_snps = parse_snp_info(snp_info,snp_info_sep)
    id_to_go = parse_go_terms(go_terms,go_sep)
    snp_with_go = add_go_to_snp(id_to_go,filtered_snps)
    #print("snp-with-go: ",snp_with_go)
    json = dict()
    json["snp_with_go"] = snp_with_go

    return jsonify(json)

def add_go_to_snp(id_to_go, filtered_snp_info) -> Tuple[dict]:
    """Adds go-terms according to gene-id to snp-info dictionary


    :param id_to_go: gene-id, go-term mapping as :type dict
    :param filterd_snp_info: snp_info table only containing snps inside genes as :type np.array
    :return: snp_with_go: pos,allele to gene-id,go-term mapping as :type dict
    """
    for key in filtered_snp_info:
        #print("keys: ", key)
        id = filtered_snp_info[key][0]
        #print("id: ", id)
        curr_go = id_to_go.get(id)
        if curr_go != None:
            filtered_snp_info[key].append(curr_go)
        else:
            filtered_snp_info[key].append("no_go_term")
    #print(filtered_snp_info)
    return filtered_snp_info

def parse_go_terms(go_terms, go_sep):
    """Parses go-terms into dictonary: gene id -> go-term

    :param go_terms: go_term file as :type str
    :param go_sep: separator tp parse go terms as :type str
    :return: id_to_go: gene id to go-term mapping as :type dict
    """
    id_to_go = dict()
    for line in csv.reader(go_terms.split('\n'), delimiter=go_sep):
        if len(line) > 0:
            id_to_go[line[0]] = line[1]
    return id_to_go


def parse_snp_info(snp_info, snp_info_sep) -> dict:
    """Parses snp_info table

    Stores Position, Allele, Annotation and Gene-Id Columns of snp-info table in
    a dictionary going from (Position, Allele)-Tuple to [Annotation, Gene-Id]-list
    if SNP is inside a gene


    :param snp_info: snp_info_table as :type str
    :param snp_info_sep: separator for parsing snp_info_table as :type str
    :return:  data: (pos, allele), [annotation, gene-id] mapping as :type dict
    """
    header_line = []
    header_to_column = dict()
    #print("old: ",header_to_column)
    #order: [position,allele] -> [annotation, gene-id]
    data = dict()
    row = 0
    for line in csv.reader(snp_info.split('\n'), delimiter=snp_info_sep):
        if len(line) > 0:
            if row == 0:
                header_line+= line
                #get indices of chosen columns
                header_to_column.update(filter_columns(header_line))
                #print("header: ",header_line)
                #print(filter_columns(header_line))
                #print("old updated: ",header_to_column)
            else:
                #fill data table
                if ((line[header_to_column["annotation"]].lower() == "missense_variant") or line[header_to_column["annotation"]].lower() == "synonymous_variant"):
                    data[str((line[header_to_column["position"]],line[header_to_column["allele"]]))] = [line[header_to_column["gene_id"]]]
        row+=1
    #print("data: ",data)
    return data


def filter_columns(headers) -> dict:
    """Computes header_column_mapping

    Used to filter chosen columns out of snp_info table

    :param headers: headers of snp_info table as :type list
    :return: header_to_column: map from headers 'position', 'allele', 'annotation'
             and 'gene_id' to column index as :type dict
    """
    col = 0
    header_to_column = dict()
    for title in headers:
        if title.lower() == "position":
            header_to_column["position"] = col
        elif title.lower() == "allele":
            header_to_column["allele"] = col
        elif title.lower() == "annotation":
            header_to_column["annotation"] = col
        elif title.lower() == "gene_id":
            header_to_column["gene_id"] = col
        col+=1
    return header_to_column




