import numpy as np
import csv
import sys
import os

from flask import jsonify
from goatools.go_enrichment import GOEnrichmentStudy
from goatools import obo_parser
import wget

#TODO: save go-hierarchy(obo) file and update automaticly from time to time
#TODO: write installation script, that installs virtual environment with flask and goatools automaticly when installing evidente
#TODO: remove all test prints

def go_enrichment(positions, snps_to_gene,gene_to_go, sig_level):
    """compute go-enrichment for chosen subtree using goatools

    :param pos_and_alleles:(position and alle)-pairs, representing snps in clade selection as :type lst
    :param snps_to_gene: map from pos,allele to gene-id
    :param gene_to_go: map from gene-id to go-term
    :return: g_res: enrichment result computed by goatools
    """
    clade,tree = prepare_go_enrichment(positions,snps_to_gene)
    gene_to_go_with_sets = prepare_gene_to_go(gene_to_go)
    go = load_go_basic()
    #clade = set(clade)
    #tree = set(tree)
    #print("tree: ",tree, type(tree))
    #print("clade: ",clade,type(clade))
    #print("pos: ",positions)
    #print("gene_to_go: ",gene_to_go,type(gene_to_go))
    g_res = compute_go_enrichment(tree, clade,gene_to_go_with_sets, go, sig_level)
    json = dict()
    json["go_result"] = g_res
    return jsonify(json)

def prepare_gene_to_go(gene_to_go):
    """Transform goterm(-list) in gene to go mapping to set in order to use goatools

    needs to be a list or a single value to be send from client to server with json, and
    has to be a set for goatools-go-enrichment

    :param gene_to_go: gene-id to go-term mapping as :type dict
    :return: gene_to_go: updatet gene-id to {go-term} maping as :type dict
    """
    for key in gene_to_go:
        #print("key: ",key, type(key))
        old = gene_to_go[key]
        #print(old, type(old))
        gene_to_go[key] = set(old)
    return gene_to_go

def compute_go_enrichment(tree, clade, gene_to_go, go, sig_level):
    """Calls goatools to compute go-enrichment for chosen clade

    :param tree: gene-ids of genes with snp in complete tree as :type set
    :param clade: gene-ids of genes with snp in chosen clade as :type set
    :param gene_to_go: gene-id -> {go-terms} as :type dict
    :param go: go hierarchy as :type .obo file
    :return: g_res: goatools go-enrichment result
    """
    g = GOEnrichmentStudy(tree, gene_to_go, go, propagate_counts=True,
                          alpha=sig_level,methods=["bonferroni"])
    g_res = g.run_study(clade)
    s_bonferroni = []
    for x in g_res:
        if x.p_bonferroni <= sig_level:
            s_bonferroni.append((x.goterm.id, x.p_bonferroni, go[x.goterm.id].name))

    #print("bonferroni: ",s_bonferroni)
    return s_bonferroni


def load_go_basic():
    """Download go-hierarchy file from website if needed

    :return: go: parsed obo-file
    """
    #TODO update file automaticly from time to time

    go_obo_url = 'http://purl.obolibrary.org/obo/go/go-basic.obo'
    data_folder = os.getcwd() + '/data'
    # Check if we have the ./data directory already
    if (not os.path.isfile(data_folder)):
        # Emulate mkdir -p (no error if folder exists)
        try:
            os.mkdir(data_folder)
        except OSError as e:
            if (e.errno != 17):
                raise e
    else:
        raise Exception('Data path (' + data_folder + ') exists as a file. '
                                                      'Please rename, remove '
                                                      'or change the desired '
                                                      'location of the data '
                                                      'path.')

    # Check if the file exists already
    if (not os.path.isfile(data_folder + '/go-basic.obo')):
        go_obo = wget.download(go_obo_url, data_folder + '/go-basic.obo')
    else:
        go_obo = data_folder + '/go-basic.obo'

    #print(go_obo)
    go = obo_parser.GODag(go_obo)
    return go


def prepare_go_enrichment(positions, snps_to_gene):
    """Prepares input for goatools

    :param positions: snp-positions as :type lst
    :param snps_to_gene: position-> locus-tag as:type dict
    :return: genes_clade: locus-tags of clade as :type lst
             genes_tree: locus-tags of tree as :type lst
    """
    genes_clade = filter_clade(positions,snps_to_gene)
    genes_tree = get_tree(snps_to_gene)
    return genes_clade, genes_tree

def get_tree(snps_to_gene):
    """get gene-ids of tree

    population input for goatools

    :param snps_to_gene: (pos,allele)-> gene-id as:type dict
    :return: gene-ids of tree as :type lst
    """
    tree = snps_to_gene.values()
    #print("tree: ",tree[0])
    genes_tree = []
    for t in tree:
        #print("t: ",t)
        #print("nur id -t? ",t[0])
        genes_tree.append(t)
    return  genes_tree

def filter_clade(positions, snps_to_gene):
    """filter gene-ids of chosen clade

    study input for goatools (subset of tree)

    :param positions: snp positions as :type lst
    :param snps_to_gene: position-> locus-tag as:type dict
    :return: locus-tags of chosen clade as :type lst
    """
    clade = []
    #print(snps_to_gene)
    for pos in positions:
        #test if snp inside gene
        if pos in snps_to_gene:
            locus_tag = snps_to_gene[pos]
            clade.append(locus_tag)
    #print("clade: ",clade)
    return clade