import random

def create_data_set(size):
    nwk = create_nwk(size)
    print(nwk)
    #create_snp_info(size)
    #create_go(size)

def create_nwk(size):
    nwk = add_childs(size-1,1)
    nwk = nwk.__add__("0;")
    return nwk



def add_childs(nodes_left, counter):
    nwk_str = ""
    #print("rekursive call------------------------")
   # print("start: ",nodes_left, counter)
    if nodes_left >> 0:
        children = random.randint(1,nodes_left)
        nodes_left = nodes_left - children
        new_counter = counter+children
        #print("children: ",children)
        #print("nodes-left: ", nodes_left)
        for child in range(0,children):
            #print("child: ",child)
            if child == children-1:
                nwk_str = str(counter).__add__(nwk_str)
                #nwk_str = nwk_str.__add__(str(counter))
                nwk_str = add_childs(nodes_left, new_counter).__add__(nwk_str)
            else:
                child_childs = random.randint(0,nodes_left)
                #print("child-childs: ",child_childs)
                nodes_left = nodes_left - child_childs
                #print("nodes-left2: ",nodes_left)
                nwk_str = str(counter).__add__(nwk_str)
                nwk_str = add_childs(child_childs,new_counter).__add__(nwk_str)
                nwk_str = (",").__add__(nwk_str)

                new_counter = new_counter + child_childs
            counter = counter+1
        nwk_str = "(".__add__(nwk_str)
        nwk_str = nwk_str.__add__(")")
        #print("nwk: ",nwk_str)
    else:
        nwk_str = ""

    return nwk_str

