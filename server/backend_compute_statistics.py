# File: backend_compute_statistics.py
# statistical computations of Evidente backend
# go-enrichment analysis for single clades and complete tree
# Written by Sophie Pesch 2021

from time import perf_counter
from flask import jsonify
import wget
import os
import time
from goatools import obo_parser
from backend_go_enrichment import GOEnrichment
from backend_nwk_parser import Tree
from backend_tree_enrichment import FindClades


def go_enrichment(all_snps, positions, snps_to_gene,gene_to_go, sig_level):
    """Enrichment analysis for given clade

    :param all_snps: all snp-positions in tree as :type list
    :param positions: snp-positions in clade as :type list
    :param snps_to_gene: snp-gene association as :type dict
    :param gene_to_go: gene-go association as :type dict
    :param sig_level: significance level as :type int
    :return: go enrichment result as :type JSON-obj
    """
    #start_load_go = perf_counter()
    go_hierarchy = load_go_basic()
    #end_load_go = perf_counter()
    #time_load_go = end_load_go - start_load_go
    #print(f"Needed {time_load_go:0.4f} seconds for loading go hierarchy")
    #start = perf_counter()
    go_en = GOEnrichment(all_snps,positions,snps_to_gene,gene_to_go,sig_level, go_hierarchy)
    result, num_assoc_go_terms,in_gene_clade, in_gene_tree = go_en.compute_enrichment()
    #end = perf_counter()
    #time_needed = end - start
    #print(f"Needed {time_needed:0.4f} seconds for go enrichment over {num_assoc_go_terms} associated go-terms")
    json = dict()
    json["go_result"] = result
    json["in_gene_tree"] =  in_gene_tree
    json["in_gene_clade"] = in_gene_clade
    return jsonify(json)





def tree_enrichment(nwk,support, num_to_lab, all_snps, node_to_snp, snps_to_gene, gene_to_go, sig_level):
    """ Computes go-enrichment for all clades owning supporting snps
        according to classico-classification in tree.

        Traverse tree to filter clades with supporting snps, calls go enrichment
        for each filtered clade and collects all significant results.

    :param nwk: phylogenetic tree as :type str (newick-format)
    :param support: nodes owning supportive snps as :type list of dicts
    :param num_to_lab: number-label association for nodes in tree as :type dict
    :param all_snps: snp-positons of all snps in tree as :type list
    :param node_to_snp: node-snp association as :type dict
    :param snps_to_gene: snp-gene association as :type dict
    :param gene_to_go: gene-go asscociation as :type dict
    :param sig_level: significance-level as :type int
    :return: json: clade-result association containing all clades
                   with significant results in the enrichment analysis stored
                   as tree-go-result in a :type json-object
    """
    #start timer for total runtime
    overall_start = perf_counter()
    #get go hierarchy, used to access go-term descriptions
    start_load_go = perf_counter()
    go_hierarchy = load_go_basic()
    #end_load_go = perf_counter()
    #time_load_go = end_load_go - start_load_go
    #print(f"Needed {time_load_go:0.4f} seconds for loading go hierarchy")

    #traverse tree and find all clades with supporting snps:
    #start_find_clades = perf_counter()
    tree = Tree()
    tree.parse_nwk_string(nwk)
    find_clades = FindClades(support, num_to_lab)
    tree.traverse_tree(find_clades)
    clades = find_clades.get_clades()
    #end_find_clades = perf_counter()
    #time_find_clades = end_find_clades-start_find_clades
    #print(f"Needed {time_find_clades:0.4f} seconds for finding clades")
    all_results = dict()

    #perform enrichment analysis for all clades found
    for clade in clades.items():
        #timer for runtime of single clade enrichment
        #start = perf_counter()
        #get snps of current clade
        snps = clade_snps(clade[1], node_to_snp)
        #compute enrichment:
        go_en = GOEnrichment(all_snps, snps, snps_to_gene, gene_to_go, sig_level,go_hierarchy)
        result, num_assoc_go_terms,in_gene_clade, in_gene_tree = go_en.compute_enrichment()
        if result:
            #store results, if existing
            all_results[clade[0]] = {"subtree": clade[1],
                                                      "result":result,
                                                      "subtree_size" : clade[1].__len__(),
                                                      "num_snps":snps.__len__(),
                                                      "in_gene_clade": in_gene_clade,
                                                      "num_go_terms": num_assoc_go_terms}
        #end = perf_counter()
        #time_needed = end - start
        #print(f"Needed {time_needed:0.4f} seconds for clade {clade[0]} with {clade[1].__len__()} nodes, {snps.__len__()} snps and {num_assoc_go_terms} associated go-terms")

    #create json-object for response to client
    json = dict()
    json["tree_go_result"] = all_results
    json["in_gene_tree"] = in_gene_tree
    #overall_end = perf_counter()
    #overall_time_needed = overall_end - overall_start
    #print(f"Needed {overall_time_needed:0.4f} seconds for enrichment over tree")
    return jsonify(json)


def clade_snps (clade_nodes, node_to_snp):
    """Gets snps of given clade

    :param clade_nodes: nodes in clade as :type list
    :param node_to_snp: node-snp association as :type dict
    :return: snps of clade as :type list
    """
    snps = []
    for node in clade_nodes:
        if str(node) in node_to_snp:
            snps.extend(node_to_snp[str(node)])
    return snps


def load_go_basic():
    """Gets go-hierarchy-file from filesytem or downloads from website and uses.
    goatools for parsing.

    Download is executed only if last download has been more than a week ago
    or if hierarchy has never been downloaded before. Otherwise go-hierarchy is
    taken from file-system. Guarantees that go-hierarchy stays up-to-date.

    :return: go: parsed obo-file
    """

    go_obo_url = 'http://purl.obolibrary.org/obo/go/go-basic.obo'
    data_folder = os.getcwd() + '/data'
    # Check if we have the ./data directory already
    if (not os.path.isdir(data_folder)):
        try:
            os.mkdir(data_folder)
        except OSError as e:
            if (e.errno != 17):
                raise e
    # Check if we have the .obo file already
    if (not os.path.isfile(data_folder + '/go-basic.obo')):
        go_obo = wget.download(go_obo_url, data_folder + '/go-basic.obo')
    else:
        time_since_last_modified = time.time() - os.path.getmtime(data_folder+'/go-basic.obo')
        if time_since_last_modified > 400:
            os.remove(data_folder + '/go-basic.obo')
            go_obo = wget.download(go_obo_url, data_folder + '/go-basic.obo')
        else:
            go_obo = data_folder + '/go-basic.obo'
    # parse hierarchy
    go = obo_parser.GODag(go_obo)
    return go
