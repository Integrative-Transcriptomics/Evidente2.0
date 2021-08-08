from time import perf_counter
from flask import jsonify
from backend_go_enrichment import GOEnrichment

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
    start = perf_counter()
    go_en = GOEnrichment(all_snps,positions,snps_to_gene,gene_to_go,sig_level)
    result = go_en.compute_enrichment()
    end = perf_counter()
    time_needed = end - start
    print(f"Needed {time_needed:0.4f} seconds for go enrichment")
    json = dict()
    json["go_result"] = result
    return jsonify(json)

