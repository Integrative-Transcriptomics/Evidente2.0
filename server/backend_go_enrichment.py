# File: backend_go_enrichment.py
# computation of go enrichment of Evidente backend
# needs snps of selection, snps of background, snp-gene-association,
# gene-go-association, significance-level and go-hierarchy as input
# Written by Sophie Pesch 2021
# Modified by Mathias Witte Paz 2021 to match our expected GoEA

import numpy as np
from scipy.stats import fisher_exact
# from icecream import ic


#computes go-enrichment, adds descriptions for enriched go-terms
class GOEnrichment:
    def __init__(self, tree_snps, clade_snps, snps_to_gene, gene_to_go_terms, sig_level, go_hierarchy):
        """construct go-enrichment object
        :param tree_snps: snps in tree as :type list
        :param clade_snps: snps in clade as :type list
        :param snps_to_gene: snp-gene association as :type dict
        :param gene_to_go_terms: gene-go-association as :type dict
        :param sig_level: significance level as :type int
        :param go_hierarchy: go_hierarchy as :type obj
        """
        self.__tree_snps = tree_snps
        self.__clade_snps = clade_snps
        self.__snps_to_gene = snps_to_gene
        self.__gene_to_go_terms = gene_to_go_terms
        self.__sig_level = sig_level
        self.__go_hierarchy = go_hierarchy

    def compute_enrichment(self):
        # return dict:go-term -> p-value, description, e/p
        results = []
        tree_go_terms, in_gene_tree = self.__associated_go_terms(self.__tree_snps)
        clade_go_terms, in_gene_clade = self.__associated_go_terms(self.__clade_snps)
        for go_term in set(clade_go_terms.keys()):
            if go_term == "No associated GO ID":
                continue
            fishers_exact = self.__fishers_exact_test(go_term, tree_go_terms, clade_go_terms, in_gene_tree, in_gene_clade)
            if fishers_exact:
                description = self.__go_to_description(go_term)
                results.append((go_term, fishers_exact, description))
        #print(results.__len__())
        results_sorted = sorted(results, key=lambda k:k[1])
        #print("in gene", in_gene_tree, in_gene_clade)
        return results_sorted, set(clade_go_terms.keys()).__len__(),in_gene_clade, in_gene_tree

    def __go_to_description(self, go_term):
        if go_term in self.__go_hierarchy.keys():
            return self.__go_hierarchy[go_term]
        return ''


    def __associated_go_terms(self, snps):
        associated = {}
        in_gene = 0
        for snp in snps:
            if snp in self.__snps_to_gene:
                in_gene += 1
                gene = self.__snps_to_gene[snp]
                if gene in self.__gene_to_go_terms:
                    go_terms = self.__gene_to_go_terms[gene]
                    for go_term in go_terms:
                        associated.setdefault(go_term,[]).append(snp)
                        # if go_term in associated.keys():
                        #     associated[go_term].append(snp)
                        # else:
                        #     associated[go_term] = [snp]
                    # associated.extend(go_terms)
                # else:
                #     associated.extend(["No associated GO ID"])
        return associated, in_gene

    def __fill_contingency_table(self, go_term, go_terms_tree, go_terms_clade, in_gene_tree, in_gene_clade):
        a = go_terms_clade[go_term].__len__()
        b = go_terms_tree[go_term].__len__() - a
        c = in_gene_clade - a
        d = in_gene_tree - a - b - c
        table = np.array([[a, b], [c, d]])
        return table

    def __fishers_exact_test(self, go_term, go_terms_tree, go_terms_clade,in_gene_tree, in_gene_clade):
        table = self.__fill_contingency_table(go_term,go_terms_tree,go_terms_clade,in_gene_tree, in_gene_clade)
        oddsratio, p_value = fisher_exact(table, alternative='greater')
        if p_value < self.__bonferroni_correction(go_terms_clade):
            return p_value
        return None


    def __bonferroni_correction(self,go_terms_clade):
        return self.__sig_level / go_terms_clade.__len__()