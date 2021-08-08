import numpy as np
from scipy.stats import fisher_exact
import os
from goatools import obo_parser


class GOEnrichment:
    def __init__(self, tree_snps, clade_snps, snps_to_gene, gene_to_go_terms, sig_level):
        self.__tree_snps = tree_snps
        self.__clade_snps = clade_snps
        self.__snps_to_gene = snps_to_gene
        self.__gene_to_go_terms = gene_to_go_terms
        self.__sig_level = sig_level
        self.__go_hierarchy = load_go_basic()

    def compute_enrichment(self):
        # return dict:go-term -> p-value, description, e/p
        results = []
        tree_go_terms = self.__associated_go_terms(self.__tree_snps)
        clade_go_terms = self.__associated_go_terms(self.__clade_snps)
        print("huhuu", set(clade_go_terms).__len__())
        for go_term in set(clade_go_terms):
            fishers_exact = self.__fishers_exact_test(go_term, tree_go_terms, clade_go_terms)
            if fishers_exact:
                description = self.__go_to_description(go_term)
                results.append((go_term, fishers_exact, description))
                # todo: add e/p !!!
        print(results.__len__())
        return results

    def __go_to_description(self, go_term):
        if go_term in self.__go_hierarchy:
            return self.__go_hierarchy[go_term].name
        return ''

    def __associated_go_terms(self, snps):
        associated = []
        for snp in snps:
            if snp in self.__snps_to_gene:
                gene = self.__snps_to_gene[snp]
                if gene in self.__gene_to_go_terms:
                    go_terms = self.__gene_to_go_terms[gene]
                    associated.extend(go_terms)
        return associated

    def __fill_contingency_table(self, go_term, go_terms_tree, go_terms_clade):
            a = go_terms_clade.count(go_term)
            b = go_terms_tree.count(go_term) - a
            c = go_terms_clade.__len__() - a
            d = go_terms_tree.__len__() - a - b - c
            table = np.array([[a, b], [c, d]])
            if go_term == 'GO:0004349':
                print(table)
            return table

    def __fishers_exact_test(self, go_term, go_terms_tree, go_terms_clade):
        table = self.__fill_contingency_table(go_term,go_terms_tree,go_terms_clade)
        #TODO beidseitig oder rechtsseitiger Test?
        oddsratio, p_value = fisher_exact(table, alternative='greater')
        if p_value < self.__bonferroni_correction(go_terms_clade):
            return p_value
        return None


    def __bonferroni_correction(self,go_terms_clade):
        return self.__sig_level / go_terms_clade.__len__()

def load_go_basic():
    """Download go-hierarchy file from website if needed

    :return: go: parsed obo-file
    """
    # TODO update file automaticly from time to time

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

    # print(go_obo)
    go = obo_parser.GODag(go_obo)
    return go
