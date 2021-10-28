# File: backend_tree_enrichment.py
# data preparation for tree enrichment of Evidente backend
# takes supporting snps and number-label association as input
# collects clades to be analysed
# Written by Sophie Pesch 2021


#class to find all clades with supporting SNPs during tree traversal
class FindClades:
    def __init__(self, support, num_to_lab):
        """Constructs State-Object for collecting supporting
        clades in tree traversal

        :param support: supporting snps as :type list of dicts
        :param num_to_lab: number-label association of tree-nodes as :type dict
        """
        self.__support = support
        self.__num_to_lab = num_to_lab
        self.__clades = dict()
        self.__stack = []
        self.__prefix = "" #only used for pretty printing


    def enter(self, node):
        """Called when entering node in tree traversal. Collects clades with
        supporting snps for root node.
        :param node: curr node as :type obj
        """
        self.__stack.append(node.get_number())
        has_support = []
        has_support.extend([snp['pos'] for snp in self.__support if
                snp["node"] == self.__num_to_lab[str(node.get_number())]])
        #add node to clades if node is part of a bigger clade containing supportive snps
        for parent in self.__stack:
            if parent in self.__clades.keys():
                self.__clades[parent].append(node.get_number())
        #add clade rooted in node if node has supportive snps
        if has_support:
            self.__clades[node.get_number()] = [node.get_number()]
        #pretty print:
        self.__prefix += "  "


    def leave(self, node):
        """Called when leaving node in tree traversal

        :param node: curr node as :type obj
        """
        #pretty print:
        self.__prefix = self.__prefix[0:-2]
        self.__stack.pop()

    def get_clades(self):
        """Returns clades with supporting snps"""
        return self.__clades


