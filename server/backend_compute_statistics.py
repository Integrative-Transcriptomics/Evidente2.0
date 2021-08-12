from time import perf_counter
from flask import jsonify
import wget
import os
import time
from goatools import obo_parser
from backend_go_enrichment import GOEnrichment
from backend_nwk_parser import Tree
from backend_tree_enrichment import FindClades
#TODO: save go-hierarchy(obo) file and update automaticly from time to time
#TODO: write installation script, that installs virtual environment with flask and goatools automaticly when installing evidente
#TODO: remove all test prints



def go_enrichment(all_snps, positions, snps_to_gene,gene_to_go, sig_level):
    """compute go-enrichment for chosen subtree using goatools

    :param pos_and_alleles:(position and alle)-pairs, representing snps in clade selection as :type lst
    :param snps_to_gene: map from pos,allele to gene-id
    :param gene_to_go: map from gene-id to go-term
    :return: g_res: enrichment result computed by goatools
    """
    start_load_go =perf_counter()
    go_hierarchy = load_go_basic()
    end_load_go = perf_counter()
    time_load_go = end_load_go - start_load_go
    print(f"Needed {time_load_go:0.4f} seconds for loading go hierarchy")
    start = perf_counter()
    go_en = GOEnrichment(all_snps,positions,snps_to_gene,gene_to_go,sig_level, go_hierarchy)
    result = go_en.compute_enrichment()
    end = perf_counter()
    time_needed = end - start
    print(f"Needed {time_needed:0.4f} seconds for go enrichment")
    json = dict()
    json["go_result"] = result
    return jsonify(json)





def tree_enrichment(nwk,support, num_to_lab, all_snps, node_to_snp, snps_to_gene, gene_to_go, sig_level):
    overall_start =perf_counter()
    print("in tree enrichment")
    go_hierarchy = load_go_basic()
    tree = Tree()
    tree.parse_nwk_string(nwk)
    find_clades = FindClades(support, num_to_lab)
    tree.traverse_tree(find_clades)
    clades = find_clades.get_clades()
    all_results = dict()
    for clade in clades.items():
        start = perf_counter()
        snps = clade_snps(clade[1], node_to_snp)
        go_en = GOEnrichment(all_snps, snps, snps_to_gene, gene_to_go, sig_level,go_hierarchy)
        result = go_en.compute_enrichment()
        if result:
            all_results[clade[0]] = (clade[1], result)
        end = perf_counter()
        time_needed = end - start
        print(f"Needed {time_needed:0.4f} seconds for clade {clade[0]} with {clade[1].__len__()} nodes and {snps.__len__()} snps")
    print("number of supp clades", clades.keys().__len__())
    print("number of results", all_results.keys().__len__())
    json = dict()
    json["tree-go-result"] = all_results
    overall_end = perf_counter()
    overall_time_needed = overall_end - overall_start
    print(f"Needed {overall_time_needed:0.4f} seconds for enrichment over tree")

    return jsonify(json)


def clade_snps (clade_nodes, node_to_snp):
    snps = []
    for node in clade_nodes:
        if str(node) in node_to_snp:
            snps.extend(node_to_snp[str(node)])
    return snps


def load_go_basic():
    """Gets go-hierarchy-file from filesytem or downloads from website

    Download is executed only if last download has been more than a week ago
    or if hierarchy has never been downloaded bevor.
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
    go = obo_parser.GODag(go_obo)
    return go
