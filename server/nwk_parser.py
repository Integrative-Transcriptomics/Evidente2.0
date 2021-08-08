import re

# Parses a NWK tree and provides tree traversal
class Tree:

    # constructs tree with number, name of top node and optional children
    def __init__(self, number=0, name="", children=[]):
        self.__name = name
        self.__number = number
        self.__children = children  # list of Trees
        self.__idx = 0  # helper counting nodes

    # parses nwk string
    # raises ValueError in case of format errors
    # NAME ::= [^,)]+
    # TREE ::= (LIST_OF_TREES)NAME | NAME
    # LIST_OF_TREES ::= TREE[,LIST_OF_TREES]
    def parse_nwk_string(self, txt):
        txt, node = self.__parse_nwk_string_rec(txt)
        txt = txt.strip()
        if txt:
            raise ValueError("parse error: remaing text: " + txt)
        self.__name = node.__name
        self.__children = node.__children
        self.__number = self.__idx

    # returns number of top node
    def get_number(self):
        return self.__number

    # returns name of top node
    def get_name(self):
        return self.__name

    # returns children of top node
    def get_children(self):
        return self.__children

    # traverses tree
    # calls enter_func() for each node when entering the node,
    # calls itself recursively for children,
    # calls leave_func() for each node when leaving the node.
    # enter_func() and leave_func() get node as first and data
    #              as second argument,
    #              return new data value,
    #              may be used to accumulate data
    #              e.g. count elements or compute prefix
    def traverse_tree_func(self, enter_func, leave_func, data):
        data = enter_func(self, data)
        for child in self.__children:
            data = child.traverse_tree_func(enter_func, leave_func, data)
        data = leave_func(self, data)
        return data


    # alternative variant of tree traversal using an object as state
    def traverse_tree(self, obj):
        obj.enter(self)
        for child in self.__children:
            child.traverse_tree(obj)
        obj.leave(self)


    # -------------------------------------------------------------
    # private part of Tree class:
    # -------------------------------------------------------------
    
    # parses the next list of subtrees (in braces)
    # returns remaining string
    def __parse_list_of_trees(self, txt):
        tree_list = []
        while txt:
            txt = txt[1:].strip()  # skip '(' or ','
            txt, subtree = self.__parse_nwk_string_rec(txt)
            tree_list.append(subtree)
            if not txt:
                raise ValueError("parse error: incomplete tree")
            elif txt[0] == ')':
                txt = txt[1:].strip()  # skip ')'
                return txt, tree_list
            elif txt[0] != ",":
                raise ValueError("parse error: missing , or ): " + txt)
        raise ValueError("parse error: missing closing brace")
    
    
    # a name is the string until the next ')', ',' or end of string
    # returns name, remaining string
    def __parse_name(self, txt):
        m = re.search("[,)]", txt)
        if m:
            span = m.span()
            # return name, remaining text
            return txt[0:span[0]], txt[span[0]:]
        else:
            return txt, ""
    
    
    # recursive parsing of nwk string
    def __parse_nwk_string_rec(self, txt):
        txt = txt.strip()
        if txt:
            tree_list = []
            if txt[0] == "(":
                txt, tree_list = self.__parse_list_of_trees(txt)
            name, txt = self.__parse_name(txt)
            self.__idx += 1
            node = Tree(number=self.__idx, name=name, children=tree_list)
        return txt, node

 #---------------------------------------------------------------------------
 #---------------------------------------------------------------------------
# propagating SNPs down to leaves by traversing tree
class Snps:
    def __init__(self, support, not_support, ids):
        self.__node_to_snps = dict()
        self.__stack = []
        self.__num = 0
        self.__num_snps = 0
        self.__all_snps = []
        self.__support = support
        self.__not_support = not_support
        self.__ids = ids
        self.__prefix = ""


    def enter(self, node):
        self.__num += 1
        self.__node_to_snps[node.get_number()] = self.__get_node_snps(node)
        #print(self.__prefix + 'enter', node.get_number(),
             # self.__stack, node.get_name(), self.__node_to_snps[node.get_number()])
        self.__stack.append(node.get_number())
        self.__prefix += "  "


    def __get_node_snps(self, node):
        snps = []
        snps.extend([snp['pos'] for snp in self.__support if
                snp["node"] == self.__ids[str(node.get_number())]])
        snps.extend([snp['pos'] for snp in self.__not_support if
                     snp["node"] == self.__ids[str(node.get_number())]])
        if self.__stack.__len__() > 0:
            snps.extend(self.__node_to_snps[self.__stack[-1]])
        self.__num_snps += snps.__len__()
        self.__all_snps.extend(snps)
        return snps

    def leave(self, node):
        self.__prefix = self.__prefix[0:-2]
        #print(self.__prefix + 'leave', node.get_number(),
              #self.__stack, node.get_name())
        self.__stack.pop()

    def get_node_to_snps(self):
        return self.__node_to_snps

    def get_number_of_nodes(self):
        return self.__num
    def get_num_snps(self):
        return self.__num_snps
    def get_all_snps(self):
        return self.__all_snps
    #---------------------------------------------------------------------------
    #---------------------------------------------------------------------------

    
if __name__ == "__main__":
    # example printing the tree:
    def print_node_enter(node, prefix):
        print(prefix + '(' + str(node.get_number()) + ') ' + node.get_name())
        return prefix + "  "
    
    def print_node_leave(node, prefix):
        return prefix[0:-2]

    
    # example keeping track of stack in state-object:
    class Stack:
        def __init__(self):
            self.__stack = []
            self.__num = 0
            self.__prefix = ""
            
        def enter(self, node):
            self.__stack.append(node.get_number())
            print(self.__prefix + 'enter', node.get_number(),
                  self.__stack, node.get_name())
            self.__num += 1
            self.__prefix += "  "
    
        def leave(self, node):
            self.__prefix = self.__prefix[0:-2]
            print(self.__prefix + 'leave', node.get_number(),
                  self.__stack, node.get_name())
            self.__stack.pop()

        def get_number_of_nodes(self):
            return self.__num


    # example counting nodes:
    def count_nodes_enter(node, num):
        return num + 1
    
    def count_nodes_leave(node, num):
        return num


    txt = "((CHAMELEON:1,((PIGEON:1,CHICKEN:1)0.9600:1,ZEBRAFINCH:1)0.9600:1)0.9600:1,((BOVINE:1,DOLPHIN:1)0.9600:1,ELEPHANT:1)0.9600:1);"
    tree = Tree()
    tree.parse_nwk_string(txt)
    #tree.traverse_tree_func(print_node_enter, print_node_leave, "")
    #stack = Stack()
    #tree.traverse_tree(stack)
    #print(stack.get_number_of_nodes(), "nodes")
    #num = tree.traverse_tree_func(count_nodes_enter, count_nodes_leave, 0)
    #print("still", num, "nodes")
    ids = {"1":"CHAMELEON", "2":"PIGEON","3":"CHICKEN","4":"2_3_","5":"ZEBRAFINCH",
           "6":"4_5_", "7":"1_6_","8":"BOVINE","9":"DOLPHIN","10":"8_9_","11":"ELEPHANT",
           "12":"10_11_","13":"7_12_"}
    support =[{"node":"CHAMELEON","pos":"451","allele":"A"},{"node":"ZEBRAFINCH","pos":"451","allele":"C"},
              {"node":"1_6_","pos":"5869","allele":"G"},{"node":"10_11_","pos":"5869","allele":"T"}]
    not_support =[{"node":"CHAMELEON","pos":"73","allele":"T"},{"node":"PIGEON","pos":"4513","allele":"A"},
                  {"node":"1_6_","pos":"2251","allele":"C"},{"node":"BOVINE","pos":"2251","allele":"T"},
                  {"node":"DOLPHIN","pos":"73","allele":"T"},{"node":"DOLPHIN","pos":"2251","allele":"C"},
                  {"node":"DOLPHIN","pos":"4513","allele":"A"},{"node":"ELEPHANT","pos":"2251","allele":"T"}]
    snp = Snps(support, not_support,ids)
    tree.traverse_tree(snp)
    print("still", snp.get_number_of_nodes(), "nodes")
    print(snp.get_num_snps() ,"snps")
    print(snp.get_node_to_snps())
    print(snp.get_all_snps())
# corresponds to:
#                                               ; 
#                  /                                                \
#              0.9600:1                                           0.9600:1 
#       /                     \                                 /         \ 
# CHAMELEON:1               0.9600:1                       0.9600:1      ELEPHANT:1
#                     /                   \               /       \
#                 0.9600:1           ZEBRAFINCH:1   BOVINE:1  DOLPHIN:1
#                /        \
#             PIGEON:1 CHICKEN:1



