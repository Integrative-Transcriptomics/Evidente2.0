# Evidente 2.0

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Requirements 
The project is running with the following requirements. Lower versions might work, but are not tested
- Node: v16.13.0
- npm: 8.1.3
- python: 3.7.4
- java: Java(TM) SE Runtime Environment (build 14.0.1+7)

## Run Devolpment Version

1. Go to project folder
2. Run setup.sh to install all npm and python packages
 `bash setup.sh`
3. Activate virtual environment
`source env/bin/activate`
4. Run development version of evidente
`npm run evidente`
5. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
## Run Deployment Version
1. Go to project folder
2. Create virtual environment
`python3 -m venv env`
3. Activate virtual environment
`source env/bin/activate`
4. Install python dependencies 
`pip install -r requirements.txt`
5. Install server package (setup.py)
`pip install .`
6. Install npm packages
`npm install`
7. Build deployment version of code
`npm run build`
8. Run server
`npm run server`
9. Access deployed version at http://localhost:5000/
## Available Examples

### Toy Example
Toy example with 38 taxa and 10 SNPs. The phylogenetic tree is a modified version of the one presented by Yokoyama et al (2008, [Publication](http://www.ncbi.nlm.nih.gov/pubmed/18768804)). The SNPs are based on the table of the _Mycobacterim leprae_ by Schuenemann et al (2018, [Publication](https://journals.plos.org/plospathogens/article?id=10.1371/journal.ppat.1006997)). Hence, this example does not show any biological data, but it can still be used to get to know the GUI of Evidente. 

### Mini Example
Extract of the Toy Example with seven taxa. This example is used to initialize Evidente. 

### _Mycobacterium leprae_
From Schuenemann et al (2018, [Publication](https://journals.plos.org/plospathogens/article?id=10.1371/journal.ppat.1006997)). The study analyzed over 169 taxa of different species around the globe and identified 3155 SNPs. It provides a metadata file with the location and date of extraction of the samples. 

### _Treponema pallidum_
From Arora et al (2016, [Publication](https://www.nature.com/articles/nmicrobiol2016245)). The study analyzed around 120 samples of different strains of the _T. pallidum_ collected around the globe. It analyzed their antibiotic resistance and it was able to identified a correlation between the presence of SNP 235204 and a resistance to the antibiotic macrolide. 

## contents.txt 
Contains a list of contents of the evidente2 repository including all files relevant during the extension of evidente2.0 together with a short description.

## CLASSICO
To get more information on the module CLASSICO visit its [repository](https://github.com/Integrative-Transcriptomics/Classico)
