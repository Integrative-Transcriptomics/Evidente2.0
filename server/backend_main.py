# File: backend_main.py
# entry point of Evidente backend
# Written by Sophie Pesch 2021

from os import abort
from backend_prepare_data import prepare_data, read_file_content
from backend_prepare_statistics import read_statistic_file_content, prepare_statistics
from backend_compute_statistics import go_enrichment
from flask import Flask, request, session, jsonify
from markupsafe import escape
import sys
#TODO: remove all test prints


# we are using flask for RESTful communication
app = Flask(__name__)
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'


@app.route('/api/upload', methods=['POST'])
def upload_data():
    """Parses data uploaded by frontend, invokes classico and returns result"""

    # noinspection PyPep8,PyBroadException
    print(request.files)
    try:
        nwk_data, snp_data, taxainfo_data, taxainfo_sep = read_file_content()
        # you may use the following lines to store data in session
        # (using cookies):
        # session['nwk'] = nwk_data
        # session['snp'] = snp_data
        # session['taxainfo'] = taxainfo_data
        return prepare_data(nwk_data, snp_data, taxainfo_data, taxainfo_sep)

    except ValueError as e:
        print("error", e.args)
        abort(500)
        # return redirect(request.url)

    except:
        print("Unexpected error:", sys.exc_info())
        abort(500)

@app.route('/api/init-example', methods=['POST'])
def load_init_example():
    try:
        nwk_data =bytes( open("./MiniExample/mini_nwk.nwk", "r").read(), 'utf-8')
        #print(nwk_data)
        snp_data = bytes(open("./MiniExample/mini_snp.tsv", "r").read(),'utf-8')
        taxainfo_data = bytes(open("./MiniExample/mini_nodeinfo.csv", "r").read(),'utf-8')
        return prepare_data(nwk_data,snp_data,taxainfo_data,",")
    except ValueError as e:
        print("error", e.args)
        abort(500)


@app.route('/api/statistic-upload', methods=['POST'])
def prepare_statistics_data():
    """Parses data sent by frontend, computes statistics and returns result"""

    # noinspection PyPep8,PyBroadException
    try:
        print("in prepare_statistics_data")
        # todo! all data must be given in input
        go_data,go_sep,snp_info_data,snp_sep,gff_data,gff_sep,available_snps = read_statistic_file_content()
        #print("type: ",type(str(snp_info_data)))
        #print("snp-info: ",str(snp_info_data))
        return prepare_statistics(gff_data.decode('utf8'),gff_sep,snp_info_data.decode('utf-8'),snp_sep,go_data.decode('utf-8'),go_sep,available_snps)
        # nwk = session.get('nwk')
        # return compute_statistics(nwk_data, snp_data, taxainfo_data)
    except ValueError as e:
        print("error ", e.args)
        abort(500)
    except:
        print("Unexpected error:", sys.exc_info()[0])
        abort(500)

@app.route('/api/statistics-request', methods=['POST'])
def compute_statistics():
    #TODO  handle statistiqs-request without statistics upload before
    data = request.get_json()
    #print(request.get_json())
    positions = data["positions"]
    snps_to_gene = data["snps_to_gene"]
    gene_to_go = data["gene_to_go"]
    sig_level = data["sig_level"]

    return go_enrichment(positions,snps_to_gene,gene_to_go,float(sig_level))
  

# just for debugging purposes:
@app.route('/<path:subpath>', methods=['POST'])
def show_post_subpath(subpath):
    """shows content of POST message"""

    # noinspection PyPep8,PyBroadException
    try:
        print('ERROR: unexpected POST Subpath=%s' % escape(subpath))
        print(request.values)
        print(request.files)
        print(session)
        abort(501)
    except ValueError as e:
        print("error ", e.args)
        abort(500)
    except:
        abort(500)


@app.route('/<path:subpath>', methods=['GET'])
def show_get_subpath(subpath):
    """shows the content of GET message"""

    print('Subpath %s' % escape(subpath))
    print(session)
    abort(501)


if __name__ == "__main__":
    app.run(port=int("3001"))
