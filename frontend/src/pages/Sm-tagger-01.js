import {useState,useEffect,useRef, useCallback} from 'react'
import { useNavigate } from "react-router-dom";

import { configuration, SideMainLayoutHeader,SideMainLayoutMenu, breadCrumbs, tagEditorI18n } from './Configs';
import { createLabelFunction } from '../components/Functions';

import {
AppLayout,
SideNavigation,
Header,
SpaceBetween,
Button,
Modal,
Box,
Flashbar,
Select,
FormField,
Container,
StatusIndicator,
ButtonDropdown,
Input,
TagEditor,
Alert,
Checkbox,
Wizard,
Textarea,
TokenGroup,
Icon,
KeyValuePairs,
Badge
} from '@cloudscape-design/components';

import CustomHeader from "../components/Header";
import CodeEditor01  from '../components/CodeEditor01';
import CustomTable01 from "../components/Table01";


function Application() {
  
  //-- Navigate object
  let navigate = useNavigate(); 
    
  
  //-- Application messages
  const [applicationMessage, setApplicationMessage] = useState([]);

  
  // Table variables Workload
  const columnsTableResources = [
    {id: 'action',header: 'Filtered',cell: item => ( 
      <div style={{"text-align" : "center"}}>                                                                                      
          <Icon name={( item['action'] == "1" ? "status-positive" : ( item['action'] == "2" ? "status-negative" : "status-pending" )  )}  />
          &nbsp; { ( item['action'] == "1" ? "Filter-In" : ( item['action'] == "2" ? "Filter-Out" : "Unknown" ) ) }
      </div> )  ,ariaLabel: createLabelFunction('action'),sortingField: 'action',},      
    {id: 'account',header: 'Account',cell: item => item['account'],ariaLabel: createLabelFunction('account'),sortingField: 'account',},
    {id: 'region',header: 'Region',cell: item => item['region'],ariaLabel: createLabelFunction('region'),sortingField: 'region',},
    {id: 'service',header: 'Service',cell: item => item['service'],ariaLabel: createLabelFunction('service'),sortingField: 'service',},
    {id: 'type',header: 'Type',cell: item => item['type'],ariaLabel: createLabelFunction('type'),sortingField: 'type',},    
    {id: 'identifier',header: 'Identifier',cell: item => item['identifier'],ariaLabel: createLabelFunction('identifier'),sortingField: 'identifier',},
    {id: 'name',header: 'Name',cell: item => item['name'],ariaLabel: createLabelFunction('name'),sortingField: 'name',},
    {id: 'creation',header: 'Creation',cell: item => item['creation'],ariaLabel: createLabelFunction('creation'),sortingField: 'creation',},    
    {id: 'tags_number',header: 'Tags',cell: item => (       
          <a  href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => showTags(item) }>
              <Badge color="blue">{item['tags_number']}</Badge>
          </a>                                                                                        
      )  ,ariaLabel: createLabelFunction('tags_number'),sortingField: 'tags_number',},      
      {id: 'metadata',header: 'Metadata',cell: item => (       
        <a href='#;' style={{ "text-decoration" : "none", "color": "inherit" }}  onClick={() => showMetadata(item) }>
            <Badge color="green">JSON</Badge>
        </a>                                                                                        
    )  ,ariaLabel: createLabelFunction('metadata'),sortingField: 'metadata',},      
    
];

const visibleContentResources = ['action', 'account', 'region', 'service', 'type', 'identifier', 'name', 'tags_number', 'metadata'];
const [datasetResources,setDatasetResources] = useState([]);

var txtRuleset = useRef("");

const [selectedRuleSet,setSelectedRuleSet] = useState({});
const [datasetRuleSet,setDatasetRuleSet] = useState([]);       

var currentScanId = useRef("");

//--## Tasks
const timeoutRef = useRef(null);

// Scan process
const [searchStatus, setSearchStatus] = useState('idle');
const [searchSummary, setSearchSummary] = useState({ action : 0 });
const [taggingStatus, setTaggingStatus] = useState('idle');

// Selected options filters
const [selectedAccounts,setSelectedAccounts] = useState([]);
const [selectedRegions,setSelectedRegions] = useState([]);
const [selectedServices,setSelectedServices] = useState([]);
const [selectedTags,setSelectedTags] = useState([]);
const accountList = useRef([]);
const regionList = useRef([]);
const serviceList = useRef([]);
const tagList = useRef([]);

const [inputAccounts, setInputAccounts] = useState("");
const [inputRegions, setInputRegions] = useState("");
const [inputServices, setInputServices] = useState("");

const [selectedAction,setSelectedAction] = useState({ label: "Add tags", value: 1 });
const actionTags = useRef(1);

// Filter
const [selectedFilter,setSelectedFilter] = useState("");
const filterList = useRef("");


//-- Start tagging process
const [checkedKnowledge, setCheckedKnowledge] = useState(false);
var taggingState = useRef("Not-Started");

// Filter Action
const [selectedFilterAction, setSelectedFilterAction] = useState({ label : 'Filter-In', value : "1" });
const filterAction = useRef("1");


// Update actions
const resourceId = useRef({});
const actionType = useRef("0");


// Modal Tags
const [visibleShowTags, setVisibleShowTags] = useState(false);

const columnsTableTags = [
  {id: 'key',header: 'Key',cell: item => item.key,ariaLabel: createLabelFunction('key'),sortingField: 'key', width : "250px"},
  {id: 'value',header: 'Value',cell: item => item.value,ariaLabel: createLabelFunction('value'),sortingField: 'value',},
];
const visibleTableTags = ['key', 'value'];
const [itemsTableTags,setItemsTableTags] = useState([]);


// Modal Metadata
const [visibleShowMetadata, setVisibleShowMetadata] = useState(false);
const [metadata,setMetadata] = useState("");


// Wizard variables
const [activeStepIndex,setActiveStepIndex] = useState(0);
var currentStep = useRef(0);



//--## Show tags for especifig resource
async function showTags(item){        
  try{    
      
      const jsonArray = Object.entries(JSON.parse(item?.['tags_list'])).map(([key, value]) => ({ key, value }));      
      setItemsTableTags(jsonArray);      
      setVisibleShowTags(true);
      
  }
  catch(err){
    console.log(err);                  
  }
}


//--## Show Metadata
async function showMetadata(item){
  try {
       
        var parameters = {                         
                        processId : "07-get-resource-metadata", 
                        scanId : item['scan_id'],
                        seq : item['seq'],
        };                
        
        const api = createApiObject({ method : 'POST', async : true });          
        api.onload = function() {                    
                  if (api.status === 200) {    
                      var response = JSON.parse(api.responseText)?.['response'];                                            
                      setMetadata(JSON.stringify(JSON.parse(response['metadata']),null,4));                          
                      setVisibleShowMetadata(true);                    
                  }
        };
        api.send(JSON.stringify({ parameters : parameters }));            
        
  }
  catch(err){
        console.log(err);
        console.log('Timeout API error - PID: 07-get-resource-metadata');                  
  }
};




//--## Create API object
function createApiObject(object){
        const xhr = new XMLHttpRequest();
        xhr.open(object.method,`${configuration["apps-settings"]["api-url"]}`,object.async);
        xhr.setRequestHeader("Authorization",`Bearer ${sessionStorage.getItem("x-token-cognito-authorization")}`);
        xhr.setRequestHeader("Content-Type","application/json");            
        return xhr;
}




//--## Gather Profiles
async function gatherProfiles(){
  try {
        
        var parameters = {                         
                        processId : "12-get-profiles"
        };        

        const api = createApiObject({ method : 'POST', async : true });          
        api.onload = function() {                    
                  if (api.status === 200) {    

                      var response = JSON.parse(api.responseText)?.['response'];                                                       
                        
                      const profiles = response.sort((a, b) => 
                          a.jsonProfile.name.localeCompare(b.jsonProfile.name)
                      );

                      var items = [];
                      profiles.forEach(element => {
                          items.push({ label: element['jsonProfile']['name'], value: element['profileId'], parameters : JSON.stringify(element['jsonProfile'],null,4) });
                      });            
                      
                      
                      if ( items.length > 0 ){

                            txtRuleset.current = items[0]['parameters'];
                            refreshParameters(JSON.parse(items[0]['parameters']));
                            setSelectedRuleSet(items[0]);                      
                      }
                      
                      setDatasetRuleSet(items);                             

                  }
        };
        api.send(JSON.stringify({ parameters : parameters }));  

   
        
  }
  catch(err){
        console.log(err);
        console.log('Timeout API error - PID: 12-get-profiles');                  
  }
};




//--## Refresh Discovery parameters
function refreshParameters(parameters){

        //-- Create option list accounts    

        var accounts = [];
        parameters['accounts'].forEach( element => {
          accounts.push({ label: element, value: element });
        });
        setSelectedAccounts(accounts);
        accountList.current = accounts;

        
        //-- Create option list regions    

        var regions = [];
        parameters['regions'].forEach( element => {
          regions.push({ label: element, value: element });
        });
        setSelectedRegions(regions);
        regionList.current = regions;

        
        //-- Create option list services

        var services = [];
        parameters['services'].forEach( element => {
          services.push({ label: element, value: element });
        });
        setSelectedServices(services);
        serviceList.current = services;

        //-- Create tag list

        var tags = [];
        parameters['tags'].forEach( element => {
          tags.push({ key: element['key'], value: element['value'] });
        });
        setSelectedTags(tags);
        tagList.current = tags;


        //-- Filters
        
        setSelectedFilter(parameters['filter']);
        filterList.current = parameters['filter'];

}


//--## Show messages
function showMessage(object){
      setApplicationMessage([
            {
              type: object.type,
              content: object.content,
              dismissible: true,
              dismissLabel: "Dismiss message",
              onDismiss: () => setApplicationMessage([]),
              id: "message_1"
            }
      ]);

}



//--## Get task information
async function getScanResults(){
      try {
           
            var parameters = {                         
                            processId : "01-get-metadata-results", 
                            scanId : currentScanId.current,
                            ruleset : JSON.parse(txtRuleset.current),
                            action : filterAction.current                        
            };        
            

            const api = createApiObject({ method : 'POST', async : true });          
            api.onload = function() {                    
                      if (api.status === 200) {    
                          var response = JSON.parse(api.responseText)?.['response'];                      
                          setDatasetResources(response['resources']);                          

                          var searchSummary = response['resources'].reduce((counts, item) => {
                            if (item.action === 1) counts.action++;                            
                            return counts;
                          }, { action: 0 });

                          setSearchSummary(searchSummary);

                      }
            };
            api.send(JSON.stringify({ parameters : parameters }));            
            
      }
      catch(err){
            console.log(err);
            console.log('Timeout API error - PID: 03-get-task-information');                  
      }
};



//--## Update resource action
async function updateResourceAction(){
  try {
       
                
        var parameters = {                         
                        processId : "04-update-resource-action", 
                        scanId : resourceId.current['scan_id'],
                        seq : resourceId.current['seq'],
                        action : actionType.current                        
        };       
        
        const api = createApiObject({ method : 'POST', async : true });          
        api.onload = function() {                    
                  if (api.status === 200) {    
                      var response = JSON.parse(api.responseText)?.['response'];                                            
                      getScanResults();
                  }
        };
        api.send(JSON.stringify({ parameters : parameters }));            
        
  }
  catch(err){
        console.log(err);
        console.log('Timeout API error - PID: 02-create-metadata-search');                  
  }
};




//--## Get Search Status
const getMetadataSearchStatus = useCallback(async () => {
      
      try {
          
          var parameters = {                         
                          processId : "03-get-metadata-search-status", 
                          scanId : currentScanId.current
          };        
          
          const api = createApiObject({ method : 'POST', async : true });          
          api.onload = function() {                    
                    if (api.status === 200) {    
                        var response = JSON.parse(api.responseText)?.['response'];         
                        if (response['status'] === 'completed') {
                            setSearchStatus('completed');         
                            showMessage({ type : "success", content : `Search process ${currentScanId.current} has been completed. Resources found (${response['resources']}).` });                                         
                            getScanResults();
                        } else if (response['status'] === 'failed') {
                            setSearchStatus('failed');
                        } else {
                          // If the task is still pending, schedule another check
                          timeoutRef.current = setTimeout(getMetadataSearchStatus, 5000); // Check again after 5 seconds
                        }                                           
                        
                    }
          };
          api.send(JSON.stringify({ parameters : parameters })); 

      } catch (err) {
        console.log('Timeout API error - PID: 03-get-metadata-search-status');  
        console.error(err);
      }
}, []);



//--## Get tagging status
const getTaggingProcessStatus = useCallback(async () => {      
  
  try {
      
      var parameters = {                         
                      processId : "06-get-tagging-process-status", 
                      scanId : currentScanId.current
      };        
      
      const api = createApiObject({ method : 'POST', async : true });          
      api.onload = function() {                    
                if (api.status === 200) {    
                    var response = JSON.parse(api.responseText)?.['response']; 
                    var message = JSON.parse(response['message']);                     
                    if (response['status'] === 'completed') {
                        setTaggingStatus('completed');   
                        showMessage({ type : "success", content : `Tagging process ${currentScanId.current} has been completed. Success (${message['success'] || 0 }), Errors (${message['error'] || 0 }).` });                        
                    } else if (response['status'] === 'failed') {
                        setTaggingStatus('failed');
                    } else {                      
                      timeoutRef.current = setTimeout(getTaggingProcessStatus, 5000); 
                    }                                           
                    
                }
      };
      api.send(JSON.stringify({ parameters : parameters })); 

  } catch (err) {
    console.log('Timeout API error - PID: 03-get-metadata-search-status');  
    console.error(err);
  }
}, []);




//--## Create search process
const handleCreateMetadataSearch = useCallback(() => {
      
      try {
       
            setDatasetResources([]);
            setSearchStatus("in-progress");

            var scanId = ((new Date().toISOString().replace("T",".").substring(0, 19)).replaceAll(":","")).replaceAll("-","");
            currentScanId.current = scanId;
            
            var ruleset = JSON.parse(txtRuleset.current);            
            ruleset['accounts'] = accountList.current;
            ruleset['regions'] = regionList.current;
            ruleset['services'] = serviceList.current;
            ruleset['tags'] = tagList.current;
            ruleset['action'] = actionTags.current;
            ruleset['filter'] = filterList.current;

            var parameters = {                         
                            processId : "02-create-metadata-search", 
                            scanId : scanId,
                            name : "system-generated",
                            ruleset : ruleset,
                            action : 1,
                            type : 1
            };        
            

            const api = createApiObject({ method : 'POST', async : true });          
            api.onload = function() {                    
                      if (api.status === 200) {    
                          var response = JSON.parse(api.responseText)?.['response'];                                                                      
                          getMetadataSearchStatus();         
                      }
            };
            api.send(JSON.stringify({ parameters : parameters }));   
            
            
      }
      catch(err){
            console.log(err);
            console.log('Timeout API error - PID: 02-create-metadata-search');                  
      }
      
}, [getMetadataSearchStatus]);



//--## Start tagging process
const handleStartTaggingProcess = useCallback(() => {
      
  try {
   
        setTaggingStatus("in-progress");
        var parameters = {                         
                        processId : "05-create-tagging-process", 
                        scanId : currentScanId.current,
                        tags : tagList.current,
                        action : actionTags.current                                      
        };        
        

        const api = createApiObject({ method : 'POST', async : true });          
        api.onload = function() {                    
                  if (api.status === 200) {    
                      var response = JSON.parse(api.responseText)?.['response'];                                                                  
                      getTaggingProcessStatus();
                  }
        };
        api.send(JSON.stringify({ parameters : parameters }));  
        
        
  }
  catch(err){
        console.log(err);
        console.log('Timeout API error - PID: 05-create-tagging-process');                    
  }
  
}, [getTaggingProcessStatus]);



//--## Goto to main dashboard
function handleGotoDashboard(){

  navigate('/dashboard');

}


  //--## Init method
  useEffect(() => {
        gatherProfiles();        
    }, []);
    
       
  return (
    <div style={{"background-color": "#f2f3f3"}}>
        <CustomHeader/>
        <AppLayout            
            breadCrumbs={breadCrumbs}
            navigation={<SideNavigation items={SideMainLayoutMenu} header={SideMainLayoutHeader} activeHref={"/workloads/"} />}
            navigationOpen={false}
            disableContentPaddings={true}
            contentType="dashboard"
            toolsHide={true}
            content={
                      <div style={{"padding" : "1em"}}>
                        
                        <br/>
                        <Wizard
                          i18nStrings={{
                                        stepNumberLabel: stepNumber =>
                                          `Step ${stepNumber}`,
                                        collapsedStepsLabel: (stepNumber, stepsCount) =>
                                          `Step ${stepNumber} of ${stepsCount}`,
                                        skipToButtonLabel: (step, stepNumber) =>
                                          `Skip to ${step.title}`,
                                        navigationAriaLabel: "Steps",
                                        cancelButton: "Cancel",
                                        previousButton: "Previous",
                                        nextButton: "Next",
                                        submitButton: "Close",
                                        optional: "optional"
                          }}
                          onNavigate={({ detail }) => {
                            setActiveStepIndex(detail.requestedStepIndex);
                            currentStep.current = detail.requestedStepIndex;
                            if (detail.requestedStepIndex == 1)
                            {
                              //gatherInventoryResources();
                            }
                            setApplicationMessage([]);
                            
                          }}
                          onSubmit={
                            handleGotoDashboard
                          }
                          onCancel={
                            handleGotoDashboard
                          }
                          activeStepIndex={activeStepIndex}
                          isLoadingNextStep={ ( searchStatus== "in-progress"  ? true : false ) }
                          steps={[                            
                            {
                              title: "Define scope",
                              description: "Define scope to search resources that you want to tag, it can include multiple accounts, regions and services.",
                              content: (
                                        <Container>
                                                <table style={{"width":"100%"}}>
                                                  <tr>  
                                                      <td valign="middle" style={{"width":"25%", "padding-right": "2em", "text-align": "center"}}>  
                                                        <FormField label={"Profiles"}>
                                                            <Select
                                                                      selectedOption={selectedRuleSet}
                                                                      onChange={({ detail }) => {
                                                                        setSelectedRuleSet(detail.selectedOption);
                                                                        txtRuleset.current = detail.selectedOption['parameters'];    
                                                                        refreshParameters(JSON.parse(detail.selectedOption['parameters']));                                                                                                                                                          
                                                                      }}
                                                                      options={datasetRuleSet}
                                                            />
                                                        </FormField>
                                                      </td>
                                                      <td valign="middle" style={{"width":"15%", "padding-right": "2em", "text-align": "center"}}>  
                                                        
                                                      </td>                                        
                                                  </tr>
                                                </table>  
                                                <br/>  
                                                <FormField label={"Accounts"}>
                                                    <Input
                                                      onChange={({ detail }) => {
                                                                
                                                                  setInputAccounts(detail.value);                                                                  
                                                                }
                                                      }
                                                      value={inputAccounts}
                                                      onKeyDown={({ detail }) => {
                                                        if (detail.keyCode == 13){
                                                              var newItems = [];
                                                              var listValues = inputAccounts.split(",");
                                                              for (var i = 0; i < listValues.length; i++) {
                                                                  if (listValues[i].trim() != "") {
                                                                    newItems.push({ label : listValues[i].trim(), value : listValues[i].trim() });
                                                                  }
                                                              }
                                                              setSelectedAccounts([...selectedAccounts, ...newItems]);
                                                              setInputAccounts("");                                                                                                                         
                                                        }                                                       
                                                      }
                                                    }
                                                    />
                                                    <TokenGroup
                                                      onDismiss={({ detail: { itemIndex } }) => {
                                                        setSelectedAccounts([
                                                          ...selectedAccounts.slice(0, itemIndex),
                                                          ...selectedAccounts.slice(itemIndex + 1)
                                                        ]);
                                                      }}
                                                      items={selectedAccounts}
                                                      limit={10}
                                                    />
                                                </FormField>
                                                <br/>
                                                <FormField label={"Regions"}>                                                  
                                                    <Input
                                                      onChange={({ detail }) => setInputRegions(detail.value)}
                                                      value={inputRegions}
                                                      onKeyDown={({ detail }) => {
                                                        if (detail.keyCode == 13){
                                                              var newItems = [];
                                                              var listValues = inputRegions.split(",");
                                                              for (var i = 0; i < listValues.length; i++) {
                                                                  if (listValues[i].trim() != "") {
                                                                    newItems.push({ label : listValues[i].trim(), value : listValues[i].trim() });
                                                                  }
                                                              }
                                                              setSelectedRegions([...selectedRegions, ...newItems]);
                                                              setInputRegions("");
                                                        }                                                       
                                                      }
                                                    }
                                                    />
                                                    <TokenGroup
                                                      onDismiss={({ detail: { itemIndex } }) => {
                                                        setSelectedRegions([
                                                          ...selectedRegions.slice(0, itemIndex),
                                                          ...selectedRegions.slice(itemIndex + 1)
                                                        ]);
                                                      }}
                                                      items={selectedRegions}
                                                      limit={10}
                                                    />
                                                </FormField>                                        
                                                <br/>
                                                <FormField label={"Services"}>                                                  
                                                    <Input
                                                      onChange={({ detail }) => setInputServices(detail.value)}
                                                      value={inputServices}
                                                      onKeyDown={({ detail }) => {
                                                        if (detail.keyCode == 13){
                                                              var newItems = [];
                                                              var listValues = inputServices.split(",");
                                                              for (var i = 0; i < listValues.length; i++) {
                                                                  if (listValues[i].trim() != "") {
                                                                    newItems.push({ label : listValues[i].trim(), value : listValues[i].trim() });
                                                                  }
                                                              }
                                                              setSelectedServices([...selectedServices, ...newItems]);
                                                              setInputServices("");
                                                        }                                                       
                                                      }
                                                    }
                                                    />
                                                    <TokenGroup
                                                      onDismiss={({ detail: { itemIndex } }) => {
                                                        setSelectedServices([
                                                          ...selectedServices.slice(0, itemIndex),
                                                          ...selectedServices.slice(itemIndex + 1)
                                                        ]);
                                                      }}
                                                      items={selectedServices}
                                                      limit={10}
                                                    />
                                                </FormField>
                                                <br/>
                                                <FormField 
                                                  label={<span>
                                                    Custom filters <i>- optional</i>{" "}
                                                  </span>}
                                                >
                                                  <Textarea
                                                      onChange={event => {
                                                                          setSelectedFilter(event.detail.value);
                                                                          filterList.current = event.detail.value;
                                                                        }
                                                      }
                                                      value={selectedFilter}
                                                      placeholder="Filter"
                                                  />
                                              </FormField>
                                              
                                              <br/>
                                              <Alert
                                                  statusIconAriaLabel="Info"
                                                  header="Filter usage"
                                                >
                                                      Filters use logical conditions. Key columns like "creation_date", "tags", "metadata", "service" can be used as part of conditions in conjunction with  logical operators like AND, OR, 	
                                                      &lt;, &gt; =.
                                                      
                                                      <br/>
                                                      <br/>
                                                      creation_date > '2025-01-01 00:00' and position( 'mytag' in tags ) > 0

                                                </Alert>
                                              
                                        </Container>
                              )
                            },              
                            {
                              title: "Manage tags",
                              description: "Select action to be performed and define list of tags for resources selected.",
                              content: (
                                        <Container>
                                          <FormField label={"Action"}>
                                          <Select
                                              selectedOption={selectedAction}
                                              onChange={({ detail }) => {
                                                  setSelectedAction(detail.selectedOption);
                                                  actionTags.current = detail.selectedOption['value'];
                                                }
                                              }
                                              options={[
                                                { label: "Add tags", value: 1, iconName: "status-positive" },
                                                { label: "Remove tags", value: 2, iconName: "status-negative" }
                                              ]}
                                          />
                                          <br/>
                                          </FormField>
                                          <TagEditor
                                            i18nStrings={tagEditorI18n}
                                            tags={selectedTags}
                                            onChange={({ detail }) => {
                                                setSelectedTags(detail.tags);
                                                tagList.current = detail.tags;                                                
                                              }
                                          
                                            }                                    
                                          />                                 
                                      </Container>

                              )
                            },
                            {
                              title: "Search resources",
                              description: "Click on Search resources to start scanning process, later you can review resources discovered, define to which ones apply tag actions, this definition will be used by tagging process.",
                              content: (
                                <div>                                    
                                    <Button 
                                          variant="primary" 
                                          onClick={() => {
                                                  accountList.current =  selectedAccounts.map(obj => obj.value);
                                                  regionList.current =  selectedRegions.map(obj => obj.value);
                                                  serviceList.current =  selectedServices.map(obj => obj.value);                                                                                                                                                      
                                                  handleCreateMetadataSearch();
                                            }                                              
                                          } 
                                          disabled={(searchStatus=="in-progress" ? true : false )}
                                          loading={(searchStatus=="in-progress" ? true : false )}
                                    >
                                          Search resources                                         

                                    </Button>
                                    <br/>
                                    <br/>
                                    <Flashbar items={applicationMessage} />
                                    <br/>                                             
                                    <Container>
                                        <CustomTable01
                                            columnsTable={columnsTableResources}
                                            visibleContent={visibleContentResources}
                                            dataset={datasetResources}
                                            title={"Resource search results - " + currentScanId.current }
                                            description={""}
                                            pageSize={10}
                                            onSelectionItem={( item ) => {                                                                                    
                                                resourceId.current = item[0];                                                
                                              }
                                            }
                                            extendedTableProperties = {
                                                { 
                                                    variant : "borderless",
                                                    loading : (searchStatus=="in-progress" ? true : false )

                                            }                                                
                                            }
                                            tableActions={
                                                        <SpaceBetween
                                                          direction="horizontal"
                                                          size="xs"
                                                        >
                                                          <Button iconName="refresh" onClick={() => { 
                                                                  getScanResults();
                                                          }}></Button>
                                                          <Select
                                                              selectedOption={selectedFilterAction}
                                                              onChange={({ detail }) => {
                                                                  setSelectedFilterAction(detail.selectedOption);
                                                                  filterAction.current = detail.selectedOption['value'] ;
                                                                  getScanResults();
                                                                }
                                                              }
                                                              options={[
                                                                { label: "Filter-In", value: "1" },
                                                                { label: "Filter-Out", value: "2" },
                                                                { label: "All", value: "3" }                                                                
                                                              ]}
                                                          />
                                                          <ButtonDropdown
                                                                      onItemClick={( item ) => {
                                                                        actionType.current = item.detail.id;
                                                                        updateResourceAction();
                                                                        }
                                                                      }
                                                                      items={[
                                                                        { text: "Move to Filter-In", id: "1" },
                                                                        { text: "Move to Filter-Out", id: "2" }
                                                                      ]}
                                                                      variant="primary"
                                                              >
                                                                Action
                                                          </ButtonDropdown>

                                                          
                                                        </SpaceBetween>
                                            }
                                                                    
                                          />
                                      </Container>
                                  </div>
                              )
                            },
                            {
                              title: "Launch tagging process",
                              description: "Start tagging process for resources according actions selected.",
                              content: (
                                          <Container>
                                              <Flashbar items={applicationMessage} />
                                              <br/>
                                              <KeyValuePairs
                                                  columns={4}
                                                  items={[
                                                    {
                                                      label: "Process identifier",
                                                      value: currentScanId.current,                                                      
                                                    }, 
                                                    {
                                                      label: "Action",
                                                      value: (
                                                        <StatusIndicator
                                                          type={ ( selectedAction['value'] == 1 ? "success" : "error")}
                                                        >
                                                            {selectedAction['label']}
                                                        </StatusIndicator>
                                                      )
                                                    },                                                                                                       
                                                    {
                                                      label: "Resources",
                                                      value: searchSummary['action'],                                                      
                                                    },                                                    
                                                    {
                                                      label: "Tags",
                                                      value: setSelectedTags.length,                                                      
                                                    },                                                    
                                                  ]}
                                                />
                                              <br/>
                                              <Alert
                                                      statusIconAriaLabel="Info"
                                                      header="By proceeding with this tagging process for AWS resources, you acknowledge and agree to the following:"
                                                    >
                                                      <br/>
                                                      1.- You understand that this process will modify resource tags across multiple AWS resources in your account(s).
                                                      <br/>
                                                      <br/>
                                                      2.- You have reviewed and verified the tagging specifications and confirm they align with your organization's tagging strategy and compliance requirements.
                                                      <br/>
                                                      <br/>
                                                      3.-You have taken necessary backups and/or documented the current tag state of affected resources before proceeding.
                                                      <br/>
                                                      <br/>
                                                      4.- You confirm you have the necessary permissions and authority to perform these changes.
                                                      <br/>
                                                      <br/>
                                                      5.-You accept full responsibility for any unintended consequences that may arise from this mass tagging operation, effects on automated processes that rely on tags, potential disruption to existing tag-based permissions or policies.
                                                      <br/>
                                                      <br/>                                                      
                                                      By proceeding, you indicate that you have read, understood, and agreed to the above statements.
                                                      <br/>
                                                      <br/>                                                      
                                                      <Checkbox
                                                          onChange={({ detail }) =>
                                                            setCheckedKnowledge(detail.checked)
                                                          }
                                                          checked={checkedKnowledge}
                                                          disabled={( taggingState.current == "Not-Started" ? false : true )}
                                                        >
                                                          I acknowledge.
                                                        </Checkbox>
                                                        
                                              </Alert>
                                              <br/>
                                              { ( taggingState.current == "Not-Started"  ) &&
                                                          <>
                                                            <Box>
                                                              <SpaceBetween direction="horizontal" size="xs">
                                                                <Button variant="primary" 
                                                                  onClick={handleStartTaggingProcess}                                                                   
                                                                  disabled={ ( ( taggingStatus=="in-progress" || checkedKnowledge == false || searchSummary['action'] == 0 )  ? true : false )}
                                                                  loading={(taggingStatus=="in-progress" ? true : false )}
                                                                  style={{ "width": "600px"}}
                                                                >
                                                                  { ( selectedAction['value'] == 1 ? "Start adding tags" : "Start removing tags")}
                                                                </Button>
                                                              </SpaceBetween>
                                                            </Box>
                                                            <br/>
                                                          </>
                                              }
                                            
                                          </Container>
                              )
                            }
                          ]}
                        />
                          
                      </div>
                
            }
          />
        
            

        <Modal
            onDismiss={() => setVisibleShowTags(false)}
            visible={visibleShowTags}
            size={"large"}
            footer={
              <Box float="right">
                <SpaceBetween direction="horizontal" size="xs">
                  <Button variant="primary" onClick={() => setVisibleShowTags(false)} >Close</Button>
                </SpaceBetween>
              </Box>
            }
            header={
                      <Header
                      variant="h1"
                      description={"Tags that are assigned to the resource."}
                    >
                      Resource tags
                    </Header>
            }            
          >            
            <CustomTable01
                  columnsTable={columnsTableTags}
                  visibleContent={visibleTableTags}
                  dataset={itemsTableTags}
                  title={"Custom tags"}
                  description={""}
                  pageSize={10}
                  onSelectionItem={( item ) => {
                      
                    }
                  }
                  extendedTableProperties = {
                      { variant : "borderless" }
                  }
              />
          </Modal>


          <Modal
            onDismiss={() => setVisibleShowMetadata(false)}
            visible={visibleShowMetadata}
            size={"max"}
            footer={
              <Box float="right">
                <SpaceBetween direction="horizontal" size="xs">
                  <Button variant="primary" onClick={() => setVisibleShowMetadata(false)} >Close</Button>
                </SpaceBetween>
              </Box>
            }
            header={
                      <Header
                      variant="h1"
                      description={"Metadata definition for the resource."}
                    >
                      Resource metadata
                    </Header>
            }            
          >            
              <CodeEditor01
                format={"json"}
                value={metadata}
                readOnly={true}
              />
          </Modal>
        
        
    </div>
  );
}

export default Application;




