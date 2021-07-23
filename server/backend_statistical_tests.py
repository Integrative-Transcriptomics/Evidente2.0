from scipy.stats import fisher_exact
from scipy.stats import kstest

#null hypothesis: hypergeometric distribution
def fishers_exact_test(con_table, alternative_hypothesis, significance_level):
    oddsratio,p_value = fisher_exact(con_table,alternative_hypothesis)
    if p_value < significance_level:
        return oddsratio,p_value
    else:
        return False


