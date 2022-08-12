# File: backend_prepare_statistics.py
# data preparation for statistical computation of Evidente backend
# takes snp_info and go_data as input
# prepares all necessary data for statistical computation
# Written by Sophie Pesch 2021


import csv
from typing import Tuple
from flask import request, jsonify
from server.backend_compute_statistics import load_go_basic


def read_statistic_file_content():
    """Reads contents of gff, go_term and snpinfo files.

    Raises value error if a file is missing .

    Returns:
       go-term-string,go-separator, snpinfo-string, snpinfo-separator
       :rtype: str
    """

    if request.method != 'POST':
        raise ValueError("unexpected method type")
    # can be used for snp-effect interpretation
    # snp_info_data = ""
    # snp_info_sep = ','
    # # check if the post request has the taxainfo part
    # if 'snp_info' in request.files:
    #     snp_info = request.files['snp_info']
    #     if snp_info != '':
    #         snp_info_data = snp_info.read()
    #     if snp_info.mimetype == "text/tab-separated-values":
    #         snp_info_sep = '\t'
    #     elif snp_info.mimetype != "text/csv" \
    #             and snp_info.mimetype != "application/octet-stream":
    #         raise ValueError("unexpected taxainfofile type ",
    #                          snp_info.mimetype)

    go_data = ""
    go_sep = '\t'
    # check if the post request has the taxainfo part
    if 'goterm' in request.files:
        goterm = request.files['goterm']
        if goterm != '':
            go_data = goterm.read()
        if goterm.mimetype == "text/csv" or ".csv" in goterm.filename:
            go_sep = ','
        elif goterm.mimetype != "text/tab-separated-values" \
                and not ".tsv" in goterm.filename \
                and goterm.mimetype != "application/octet-stream"\
                and goterm.mimetype != "text/x-go":
            raise ValueError("unexpected taxainfofile type ",
                             goterm.mimetype)

    gff_data = ""
    gff_sep = '\t'
    # check if the post request has the taxainfo part
    if 'gff' in request.files:
        gff = request.files['gff']
        if gff != '':
            gff_data = gff.read()
        if gff.mimetype == "text/csv" or ".csv" in gff.filename:
            gff_sep = ','
        elif gff.mimetype != "text/tab-separated-values" \
                and ".tsv" in gff.filename \
                and gff.mimetype != "application/octet-stream":
            raise ValueError("unexpected gff type ",
                             gff.mimetype)

    available_snps = request.form['availabel_snps'].split(',')
    return go_data, go_sep, gff_data, gff_sep, available_snps


def prepare_statistics(gff, gff_sep, go_terms, go_sep, available_snps, return_dict=False):
    """Prepares gff and go data for statistical computations
       Holds possibility to use snp_info data in addition to gff

    Parses gff data and computes dict from pos to locus-tag for all snps inside genes
    within the given phylogenetic tree.
    Sends preprocessed gff and go data as json to client.

    :param gff: gff file as :type str
    :param gff_sep: separator to parse gff as :type str
    :param snp_info: snp_info file as :type str
    :param snp_info_sep: separator to parse snp_info as :type str
    :param go_terms: go_term file as :type str
    :param go_sep: separator to parse go file as :type str
    :return: json: json containing snp_with_go as :type dict
    """
    #snps_to_gene = parse_snp_info(snp_info,snp_info_sep)
    go_hierarchy = load_go_basic()

    gene_range_with_locus_tag = parse_gff(gff, gff_sep)
    snps_to_gene, gene_to_snp = get_gene_for_snp(
        available_snps, gene_range_with_locus_tag)
    id_to_go, go_to_snp = parse_go_terms(go_terms, go_sep, gene_to_snp)
    id_to_go, go_to_snp = add_all_propagated_terms(
        go_hierarchy, id_to_go, go_to_snp)

    json = dict()
    json["snps_to_gene"] = snps_to_gene
    json["go_to_snp_pos"] = go_to_snp
    json["id_to_go"] = id_to_go
    if return_dict:
        return json
    return jsonify(json)


def parse_gff(gff, gff_sep):
    """ Parses gff-file into sorted list of lists containing start-, end-positions and
        locus tags of all genes

    :param gff: gff-file as :type  str
    :param gff_sep: separator for gff-table as :type str
    :return: gene_range_with_locus_tag: all gene-ranges and corresponding locus-tags
             as :type list of [start-pos,end-pos,locus-tag]-lists sorted by start-pos
    """
    gene_range_with_locus_tag = list()
    for line in csv.reader(gff.split('\n'), delimiter=gff_sep):
        if len(line) > 8:
            if line[2].lower() == "gene":
                gene_range_with_locus_tag.append(
                    [line[3], line[4], get_locus_tag(line[8])])
    # sort by start position
    #gene_range_with_locus_tag_sorted = sorted(gene_range_with_locus_tag,key=lambda x:int(x[0]))
    return gene_range_with_locus_tag


def get_locus_tag(col):
    """Checks if given field of gff-file contains locus-tag and if so, returns locus-tag

    :param col: last-column of a gff-row as :type str
    :return: locus tag if available, None otherwise
    """
    entries = col.split(';')
    for item in entries:
        record = item.split('=')
        if record[0].lower() == "locus_tag":
            return record[1]
    return None


def get_gene_for_snp(available_snps, gene_range_with_locus_tag):
    """Computes mapping from snp-position to locus-tag for all snps in genes.

    Performs a binary search on the list of genes by position for all snps.

    :param available_snps: all positions with snps in the whole phylogenetic
    tree as :type list
    :param gene_range_with_locus_tag: start,end positions and locus-tags as
           :type list([],[],...)

    :return: mapping from snp-position to locus-tag as :type dict()
    """
    snp_to_locus_tag = dict()
    locus_tag_to_snp = dict()
    # find gene for each position with snp:
    for snp in available_snps:
        gene = search_gene_binary(gene_range_with_locus_tag, int(snp))
        if gene:
            gene = gene.strip()
            snp_to_locus_tag[snp] = gene
            locus_tag_to_snp.setdefault(gene, []).append(snp)
    sum = 0
    for item in locus_tag_to_snp.items():
        sum += item[1].__len__()
    return snp_to_locus_tag, locus_tag_to_snp


def search_gene_binary(gene_range_with_locus_tag, snp_pos):
    """Computes if snp is inside gene and if so, finds locus-tag

    :param gene_range_with_locus_tag: gene-ranges and locus tags as :type list([])
    :param snp_pos: position of snp as:type int
    :return: corresponding locus-tag as :type str if snp inside gene, False otherwise
    """
    if len(gene_range_with_locus_tag) == 0:
        return False
    else:
        middle = len(gene_range_with_locus_tag)//2  # floor division
        mid_gene = gene_range_with_locus_tag[middle]
        start = int(mid_gene[0])
        end = int(mid_gene[1])
        if snp_pos >= start and snp_pos <= end:
            return mid_gene[2]
        else:
            if snp_pos < start:
                return search_gene_binary(gene_range_with_locus_tag[:middle], snp_pos)
            else:
                return search_gene_binary(gene_range_with_locus_tag[middle+1:], snp_pos)


def parse_go_terms(go_terms, go_sep, locus_tag_to_snps):
    """Parses go-terms into dictonary: gene id -> go-term

    :param go_terms: go_term file as :type str
    :param go_sep: separator tp parse go terms as :type str
    :return: id_to_go: gene id to go-term mapping as :type dict
    """
    id_to_go = dict()
    go_to_snps = dict()
    for line in csv.reader(go_terms.split('\n'), delimiter=go_sep):
        if len(line) >= 2:
            locus_tag = line[0].strip()
            line_go_terms_ = line[1].split(';')
            line_go_terms = [go.strip() for go in line_go_terms_]
            if line_go_terms:
                if id_to_go.__contains__(locus_tag):
                    id_to_go[locus_tag].extend(line_go_terms)
                else:
                    id_to_go[locus_tag] = line_go_terms
                #
    for locus, go_terms in id_to_go.items():
        for go_term in go_terms:
            if locus_tag_to_snps.__contains__(locus):
                go_to_snps.setdefault(go_term, []).extend(
                    locus_tag_to_snps[locus])

    return id_to_go, go_to_snps


def add_all_propagated_terms_to_snps(go_hierarchy, go_to_snp):
    """Extends go-term snp association by all parents of directly
    associated go-terms.

    :param go_hierarchy:
    :param go_to_snp: go-term to snp mapping for all directly associated
    go-terms as :type dict
    :return: go_to_snp2: go-term to snp mapping containing all associated
    go-terms as :type dict
    """
    go_terms = go_to_snp
    go_to_snp2 = dict()
    for go_term, snps in go_terms.items():
        go_to_snp2.setdefault(go_term, []).extend(snps)
        parents = collect_parents(go_term, go_hierarchy)
        for parent in parents:
            go_to_snp2.setdefault(parent, []).extend(snps)
    return go_to_snp2


def add_all_propagated_terms(go_hierarchy, id_to_go, go_to_snp):
    """Extends gene-go and go-snp association by parent terms of
    directly associated go-terms

    :param go_hierarchy:
    :param id_to_go: gene to go-term mapping as :type dict()
    :param go_to_snp: go-term to snp mapping as :type dict()
    :return: id_to_go_ext, go_to_snp_ext: extended mappings from gene to go-term
    and go-term to snps as :type dict
    """
    go_to_snp_ext = add_all_propagated_terms_to_snps(
        go_hierarchy, go_to_snp.copy())
    id_to_go_ext = dict()
    for id in id_to_go.keys():
        gos = id_to_go[id]
        go_set = set(gos)
        for go in gos:
            parents = collect_parents(go, go_hierarchy)
            go_set.update(parents)
        id_to_go_ext[id] = list(go_set)
    return id_to_go_ext, go_to_snp_ext


def collect_parents(go_id, go_hierarchy):
    """Collects all parents of given go-term.

    :param go_id: id of given go-term
    :param go_hierarchy:
    :return: parents of given go_term as :type list
    """
    try:
        parents = go_hierarchy[go_id].get_all_parents()
    except:
        parents = []

    return parents


# -------------------------------------------------------------------------------
# -------------------------------------------------------------------------------
# methods for parsing snp-info-file not used in current version of evidente2.0

# def parse_snp_info(snp_info, snp_info_sep) -> dict:
#     """Parses snp_info table

#     Stores Position, Allele, Annotation and Gene-Id Columns of snp-info table in
#     a dictionary going from (Position, Allele)-Tuple to [Annotation, Gene-Id]-list
#     if SNP is inside a gene


#     :param snp_info: snp_info_table as :type str
#     :param snp_info_sep: separator for parsing snp_info_table as :type str
#     :return:  data: (pos, allele), [annotation, gene-id] mapping as :type dict
#     """
#     header_line = []
#     header_to_column = dict()
#     #print("old: ",header_to_column)
#     #order: [position,allele] -> [annotation, gene-id]
#     data = dict()
#     row = 0
#     for line in csv.reader(snp_info.split('\n'), delimiter=snp_info_sep):
#         if len(line) > 0:
#             if row == 0:
#                 header_line+= line
#                 #get indices of chosen columns
#                 header_to_column.update(filter_columns(header_line))
#             else:
#                 #fill data table
#                 if ((line[header_to_column["annotation"]].lower() == "missense_variant") or line[header_to_column["annotation"]].lower() == "synonymous_variant"):
#                     data[str((line[header_to_column["position"]],line[header_to_column["allele"]]))] = [line[header_to_column["gene_id"]]]
#         row+=1
#     #print("data: ",data)
#     return data


# def filter_columns(headers) -> dict:
#     """Computes header_column_mapping

#     Used to filter chosen columns out of snp_info table

#     :param headers: headers of snp_info table as :type list
#     :return: header_to_column: map from headers 'position', 'allele', 'annotation'
#              and 'gene_id' to column index as :type dict
#     """
#     col = 0
#     header_to_column = dict()
#     for title in headers:
#         if title.lower() == "position":
#             header_to_column["position"] = col
#         elif title.lower() == "allele":
#             header_to_column["allele"] = col
#         elif title.lower() == "annotation":
#             header_to_column["annotation"] = col
#         elif title.lower() == "gene_id":
#             header_to_column["gene_id"] = col
#         col+=1
#     return header_to_column
