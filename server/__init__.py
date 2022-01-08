# File: __init__.py
# entry point of Evidente backend
# Written by Sophie Pesch 2021
import os
from os import abort
from time import perf_counter, sleep
from server.backend_prepare_data import prepare_data, read_file_content
from server.backend_prepare_statistics import read_statistic_file_content, prepare_statistics
from server.backend_compute_statistics import go_enrichment, tree_enrichment
from flask import Flask, request, session, jsonify
from markupsafe import escape
import multiprocessing as mp

import sys


# we are using flask for RESTful communication
app = Flask(__name__, static_folder='../build', static_url_path='/')
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'
here = os.path.dirname(__file__)
app.config['EXAMPLE_DATA'] = os.path.join(here,'MiniExample')
app.config['FILES_STREPTOMYCES'] = os.path.join(here, 'data', 'caseStudy_colnames')


@app.route('/api/upload', methods=['POST'])
def upload_data():
    """Parses data uploaded by frontend, invokes classico and
    sends result to client.

    :return: Preprocessed phylogenetic data as :type JSON-object
    """

    # noinspection PyPep8,PyBroadException
    print(request.files)
    try:
        nwk_data, snp_data, taxainfo_data, taxainfo_sep = read_file_content()
        # you may use the following lines to store data in session
        # (using cookies):
        # session['nwk'] = nwk_data
        # session['snp'] = snp_data
        # session['taxainfo'] = taxainfo_data
        response = prepare_data(
            nwk_data, snp_data, taxainfo_data, taxainfo_sep, 'taxainfo' in request.files)
        # prepare_data(nwk_data, snp_data, taxainfo_data, taxainfo_sep)
        return response

    except ValueError as e:
        print("error", e.args)
        return jsonify({'error': 'internal server error'}), 500
        # return redirect(request.url)

    except:
        print("Unexpected error:", sys.exc_info())
        return jsonify({'error': 'internal server error'}), 500


@app.route('/api/init-example', methods=['POST'])
def load_init_example():
    """ Loads files evidente-start example from directory, parsed data,
     invokes classico and sends result to client.
    :return: preprocessed phylogenetic data as :type Json-object
    """
    try:
        nwk_data = bytes(
            open(os.path.join(app.config['EXAMPLE_DATA'],"mini_nwk.nwk"), "r").read(), 'utf-8')
        # print(nwk_data)
        snp_data = bytes(
            open(os.path.join(app.config['EXAMPLE_DATA'],"mini_snp.tsv"), "r").read(), 'utf-8')
        taxainfo_data = bytes(
            open(os.path.join(app.config['EXAMPLE_DATA'],"mini_nodeinfo.csv"), "r").read(), 'utf-8')
        return prepare_data(nwk_data, snp_data, taxainfo_data, ",",True)
    except ValueError as e:
        print("error", e.args)
        return jsonify({'error': 'internal server error'}), 500

@app.route('/api/init-stats', methods=['POST'])
def load_init_stats():
    """ Loads statistical files evidente-start example from directory, parses data 
     and sends result to client.
    :return: preprocessed statistical data as :type Json-object
    """
    try:
        gff_data = bytes(
            open(os.path.join(app.config['EXAMPLE_DATA'],"mini_gff.csv"), "r").read(), 'utf-8')
        # print(nwk_data)
        go_data = bytes(
            open(os.path.join(app.config['EXAMPLE_DATA'],"mini_go_terms.csv"), "r").read(), 'utf-8')
        available_snps = request.form['available_snps'].split(',')
        response = prepare_statistics(gff_data.decode(
            'utf8'),",", go_data.decode('utf-8'), ",", available_snps)
        return response
    except ValueError as e:
        print("error", e.args)
        return jsonify({'error': 'internal server error'}), 500

@app.route('/api/statistic-upload', methods=['POST'])
def prepare_statistics_data():
    """Parses data sent by frontend, prepares statistical data and
    sends result to client.

    :return: preprocessed statistical data as :type JSON-object
    """
    try:
        # print("in prepare_statistics_data")
        # start = perf_counter()

        go_data, go_sep, gff_data, gff_sep, available_snps = read_statistic_file_content()
        response = prepare_statistics(gff_data.decode(
            'utf8'), gff_sep, go_data.decode('utf-8'), go_sep, available_snps)
        # end = perf_counter()
        # time_needed = end - start
        # print(f"Needed {time_needed:0.4f} seconds for statistics data preparation")
        return response

    except ValueError as e:
        print("error ", e.args)
        return jsonify({'error': 'internal server error'}), 500

    except:
        print("Unexpected error:", sys.exc_info()[0])
        return jsonify({'error': 'internal server error'}), 500


@app.route('/api/statistics-request', methods=['POST'])
def compute_statistics():
    """Parses data sent by frontend,  computes go-enrichment and
    sends result to client.

    :return: go_enrichment result as :type JSON-object
    """
    try:
        data = request.get_json()
        positions = data["positions"]
        snps_to_gene = data["snps_to_gene"]
        gene_to_go = data["gene_to_go"]
        sig_level = data["sig_level"]
        all_snps = data["all_snps"]
        result = go_enrichment(all_snps, positions,
                               snps_to_gene, gene_to_go, float(sig_level))
        # go_enrichment(all_snps, positions,snps_to_gene,gene_to_go, float(sig_level))
        return result
    except:
        print("Unexpected error:", sys.exc_info()[0])
        return jsonify({'error': 'internal server error'}), 500


@app.route('/api/tree-statistics-request', methods=['POST'])
def compute_tree_statitics():
    """Parses data sent by frontend,  performs tree-analysis and
      sends result to client.

      :return: tree-analysis result as :type JSON-object
      """
    try:
        data = request.get_json()
        # print(request.get_json())
        nwk = data["nwk"]
        support = data["support"]
        num_to_lab = data["num_to_label"]
        snps_to_gene = data["snps_to_gene"]
        node_to_snps = data["node_to_snps"]
        gene_to_go = data["gene_to_go"]
        sig_level = data["sig_level"]
        all_snps = data["all_snps"]
        # go_to_description = data["go_to_description"]
        response = tree_enrichment(nwk, support, num_to_lab, all_snps,
                                   node_to_snps, snps_to_gene, gene_to_go, float(sig_level))
        return response
    except:
        print("Unexpected error:", sys.exc_info()[0])
        return jsonify({'error': 'internal server error'}), 500

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


@app.route('/test_timeout', methods=['GET'])
def test_timeout():
    print("start sleep")
    sleep(301)
    return jsonify("done")


@app.route('/', methods=['GET'])
def index():
    return app.send_static_file('index.html')

if __name__ == "__main__":
    mp.set_start_method('spawn')    

    app.run(debug=True, port=int("3001"))
