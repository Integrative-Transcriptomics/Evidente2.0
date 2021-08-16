import numpy as np
from scipy.stats import fisher_exact



class GOEnrichment:
    def __init__(self, tree_snps, clade_snps, snps_to_gene, gene_to_go_terms, sig_level, go_hierarchy):
        self.__tree_snps = tree_snps
        self.__clade_snps = clade_snps
        self.__snps_to_gene = snps_to_gene
        self.__gene_to_go_terms = gene_to_go_terms
        self.__sig_level = sig_level
        self.__go_hierarchy = go_hierarchy

    def compute_enrichment(self):
        # return dict:go-term -> p-value, description, e/p
        results = []
        tree_go_terms = self.__associated_go_terms(self.__tree_snps)
        clade_go_terms = self.__associated_go_terms(self.__clade_snps)
        for go_term in set(clade_go_terms):
            fishers_exact = self.__fishers_exact_test(go_term, tree_go_terms, clade_go_terms)
            if fishers_exact:
                description = self.__go_to_description(go_term)
                results.append((go_term, fishers_exact, description))
                # todo: add e/p !!!
        #print(results.__len__())
        return results, set(clade_go_terms).__len__()

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

