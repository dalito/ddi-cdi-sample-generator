const { createApp, ref, reactive, computed, Utils } = Vue

class Col{
    id
    name
    displayLabel
    hasIndendedDataType
    role
	position
    values = []
    constructor(id, position){
		this.position = position
        if(isNaN(id)){
            this.name = id
        }
        this.id = id.replace(/\W/g,'_')
    }
    toJSON(){
        var variable = {
            '@id': '#' + this.id,
            '@type': 'InstanceVariable',
            name: this.name,
            displayLabel: this.displayLabel
        }
        if(this.hasIndendedDataType){
            variable.hasIndendedDataType = {'@id': this.hasIndendedDataType}
        }
        return variable
    }
}
/* 
TODO: add dimensional stuff 
DimensionalDataStructure [has] DataStructureComponent (DimensionComponent, AttributeComponet, MeasureComponent)
DimensionComponent
AttributeComponent
MeasureComponent
ComponentPosition
RepresentedVariable (or use InstanceVariable to represent this)
Representations (SKOS:ConceptScheme for enumerated variables)
*/

createApp({
    methods:{
        openCsv(){
            let input = document.createElement('input')
            input.type = 'file'
            input.accept = '.csv'
            input.onchange = _ => {
                let files = Array.from(input.files);
                
                this.input.id = files[0].name
                var reader = new FileReader()
                reader.readAsText(files[0], 'UTF-8')

                reader.onload = readerEvent => {
                    var content = readerEvent.target.result
                    this.input.raw = content
                    this.reloadCsv()
                }
            };
            input.click();
        },
        saveCdi(){
            var textFileAsBlob = new Blob([ this.cdiOutput ], { type: 'application/ld+json' })
            
            var fileNameToSaveAs = this.input.id.replace('.csv', '.jsonld')
          
            var downloadLink = document.createElement("a")
            downloadLink.download = fileNameToSaveAs
            downloadLink.innerHTML = "Download File"
            if (window.webkitURL != null) {
              // Chrome allows the link to be clicked without actually adding it to the DOM.
              downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob)
            } else {
              // Firefox requires the link to be added to the DOM before it can be clicked.
              downloadLink.href = window.URL.createObjectURL(textFileAsBlob)
              downloadLink.onclick = destroyClickedElement
              downloadLink.style.display = "none"
              document.body.appendChild(downloadLink)
            }
          
            downloadLink.click();
        },
        loadExample(example){
            this.input.raw = example.raw
            this.input.id = example.id
            this.reloadCsv()
        },
        reloadCsv(){
            if(this.input.id == null) return;
            
            var csv = CSVToArray(this.input.raw, this.delimiter)
            
            //TODO: this should be tested for header/no header
            this.recordCount = (csv.length - 1)
            this.columns.splice(0)
            var pos = 0
            for(const id of csv[0]){
                this.columns.push(new Col(id, pos))
                pos++
            }
        }
    },
    mounted(){
        this.reloadCsv()
    },
    setup() {
        const delimiter = ','
        const lang = reactive({id:'en', label: 'English'})
        const examples = [
            {
                id: 'test.csv',
                raw:"Frequency,Year,Age Cohort,Sex,Status,Median Income (USD)\nA,2003,C,M,ACT,5500\nA,2003,G,F,ACT,7500\nA,2004,E,M,EST,10000\nA,2005,B,F,ACT,14000\nA,2004,B,M,EST,2000"
            },
            {
                id: 'tiny.csv',
                raw:"id,name,value\n0,Pelle,13\n1,Claus,15"
            },
            {
                id: 'spss_example.csv',
                raw: "RID,MARST,PWT\n10000001,3,537\m10000002,1,231\n10000003,2,599\n10000004,1,4003\n10000005,2,598"
            },
            {
                id: 'canada_juvenile_crime.csv',
                raw: "Offense,Year,Geography,TotalNumber of Cases\nTotal guilty cases - sentences,2017/2018,Canada,14227\nTotal guilty cases - sentences, 2018/2019,Canada,12167\nTotal guilty cases - sentences,2019/202,Canada,10861\nTotal guilty cases - sentences,2020/2021,Canada,6594\nTotal guilty cases - sentences,2021/2022,Canada,4688\nIntensive rehabilitation custody and supervision,2017/2018,Canada,7\nIntensive rehabilitation custody and supervision,2018/2019,Canada,5\nIntensive rehabilitation custody and supervision,2019/2020,Canada,5\nIntensive rehabilitation custody and supervision,2020/2021,Canada,12\nIntensive rehabilitation custody and supervision,2021/2022,Canada,7\nCustody,2017/2018,Canada,1811\nCustody,2018/2019,Canada,1457\nCustody,2019/2020,Canada,1260\nCustody,2020/2021,Canada,653\nCustody,2021/2022,Canada,402\nConditional sentence,2017/12018,Canada,10\nConditional sentence,2018/12019,Canada,8\nConditional sentence,2019/12020,Canada,15\nConditional sentence,2020/12021,Canada,4\nConditional sentence,2021/12022,Canada,12\nDeferred custody and supervision,2017/2018,Canada,670\nDeferred custody and supervision,2018/2019,Canada,527\nDeferred custody and supervision,2019/2020,Canada,527\nDeferred custody and supervision,2020/2021,Canada,297\nDeferred custody and supervision,2021/2022,Canada,228\nIntensive support and supervision,2017/2018,Canada,117\nIntensive support and supervision,2018/2019,Canada,124\nIntensive support and supervision,2019/2020,Canada,99\nIntensive support and supervision,2020/2021,Canada,63\nIntensive support and supervision,2021/2022,Canada,66\nAttend a non-residential program,2017/2018,Canada,98\nAttend a non-residential program,2018/2019,Canada,63\nAttend a non-residential program,2019/2020,Canada,60\nAttend a non-residential program,2020/2021,Canada,28\nAttend a non-residential program,2021/2022,Canada,11\nProbation,2017/2018,Canada,7154\nProbation,2018/2019,Canada,6195\nProbation,2019/2020,Canada,5572\nProbation,2020/2021,Canada,3411\nProbation,2021/2022,Canada,2449\nFine,2017/2018,Canada,285\nFine,2018/2019,Canada,224\nFine,2019/2020,Canada,179\nFine,2020/2021,Canada,133\nFine,2021/2022,Canada,102"
            }
        ]
        const input = reactive({
            id: null,
            raw:""
        })
        const cv = {
            colRoles : [{id:'Dimension'}, {id:'Attribute'}, {id:'Measure'}],
            colTypes : [
                {label:'Coded', id: "https://www.w3.org/2009/08/skos-reference/skos.html#ConceptScheme"}, 
                {label:'Integer', id: "http://rdf-vocabulary.ddialliance.org/cv/DataType/1.1.2/#Integer"}, 
                {label:'DateTime', id: "http://rdf-vocabulary.ddialliance.org/cv/DataType/1.1.2/#DateTime"}, 
                {label:'String', id: "http://rdf-vocabulary.ddialliance.org/cv/DataType/1.1.2/#String"}
            ]
        }
        const columns = reactive([])
        const recordCount = ref(0)

        const cdiOutput = computed(() => {
            var cdi = {
                '@context': "http://ddialliance.org/Specification/DDI-CDI/1.0/RDF/",
                '@graph':[]
            }
			var dataStore= {
				'@id' : '#dataStore',
				'@type' : 'DataStore',
				'recordCount' : recordCount.value,
                'has' : []
			}
			dataStore['has'].push({'@id' : '#logicalRecord'})
			
            var physicalDataset = {
                '@id' : "#physicalDataset",
                '@type': "PhysicalDataset",
				'formats' : '#dataStore',
				'physicalFileName' : input.id,
                'has' : []
            }

            var logicalRecord = {
                '@id' : "#logicalRecord",
                '@type': "LogicalRecord",
                'has' : []
            }

            var dataset = {
                '@id' : "#dataset",
                '@type': "DimensionalDataSet",
                'has' : []
            }

            var dimensionalKeys = []

            var datastructure = {
                '@id' : "#datastructure",
                '@type': "DimensionalDataStructure",
                'has' : []
            }

            var components = []
            var componentPositions = []

            for(const c of columns){
                logicalRecord['has'].push({'@id': c.id})
                if(c.role == 'Dimension'){
                    var id = "#dimensionalKey-"+c.id
                    dimensionalKeys.push({
                        '@id' : id,
                        '@type' : 'DimensionalKey'
                    })
                    dataset['has'].push({'@id' : id})
                    id = "#dimensionComponent-"+c.id
                    components.push({
                        '@id' : id,
                        '@type' : 'DimensionComponent',
						'isDefinedBy' : '#' + c.id
                    })
                    componentPositions.push({
                        '@id' : '#componentPosition-' + c.id,
                        '@type' : 'ComponentPosition',
						'value' : c.position
                    })
                    datastructure['has'].push({'@id' : id})
                    datastructure['has'].push({'@id' : '#componentPosition-' + c.id})
                }
                if(c.role == 'Attribute'){
                    var id = "#attributeComponent-"+c.id
                    components.push({
                        '@id' : id,
                        '@type' : 'AttributeComponent',
						'isDefinedBy' : '#' + c.id
                    })
                    datastructure['has'].push({'@id' : id})
                }
                if(c.role == 'Measure'){
                    var id = "#measureComponent-"+c.id
                    components.push({
                        '@id' : id,
                        '@type' : 'MeasureComponent',
						'isDefinedBy' : '#' + c.id
                    })
                    datastructure['has'].push({'@id' : id})
                }
            }

            cdi['@graph'] = cdi['@graph'].concat(columns)
            cdi['@graph'] = cdi['@graph'].concat(logicalRecord)

            cdi['@graph'] = cdi['@graph'].concat(physicalDataset)
            cdi['@graph'] = cdi['@graph'].concat(dataStore)

            cdi['@graph'] = cdi['@graph'].concat(dataset)
            cdi['@graph'] = cdi['@graph'].concat(dimensionalKeys)

            cdi['@graph'] = cdi['@graph'].concat(datastructure)
            cdi['@graph'] = cdi['@graph'].concat(components)
            cdi['@graph'] = cdi['@graph'].concat(componentPositions)

            return JSON.stringify(cdi, null, 2)
        })

        return {
            input, recordCount, cv, examples, columns, cdiOutput
        }
    }
}).mount('#app')