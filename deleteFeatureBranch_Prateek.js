var fs = require('fs');
var request = require('request');
var branchNames = [];
var updatedBranchNames = [];
var verifyCount = 0;
var branchSize = 0;
var branchStatus =[]; 
var releaseVersion=[];


function getOpenFeatureBranchesFromGit() {
	console.log("start");
	request(
		{
			'headers':
			{
				'Authorization': 'token ba2d620a1437a4e9b7549388392a03af3ba9c1c1',
				'X-GitHub-Media-Type': 'application/vnd.github.symmetra-preview+json',
				'user-agent': 'node.js'
			},
			'uri': 'https://api.github.com/repos/ILC-Technology/Salesforce/branches?per_page=100',
			'method': 'GET'
		},
		function (err, res, body) {
			var nameOfTheBranch = [];
			var jsonData = JSON.parse(body);
			var arr = [];
			if (jsonData) {
				let branchCount = jsonData.length;
				let counter = 0;
				jsonData.forEach(function (branch) {
					arr = branch.name.split("/");
					nameOfTheBranch.push(arr[0]);
					counter = counter + 1;
					
					if (branchCount == counter) {
						findAllSFBranch(nameOfTheBranch);
					}
				});
			}
			else {
				console.log("No data availble")
			}

		})
	console.log("end");
}

function findAllSFBranch(branchNames) {
	let counterIncrement = 0;
	let branchNameLength = branchNames.length;
	let sfCounter = 0;

	branchNames.forEach(function (a) {
		counterIncrement = counterIncrement + 1;
		if (a.startsWith("SF-")) {
			sfCounter = sfCounter + 1;
		}
	});
	if (counterIncrement == branchNameLength) {
		getJIRADetails(branchNames, sfCounter);
	}

}

function getJIRADetails(branchNames, sfCounter) {
	var updatedBranch = [];
	branchSize = sfCounter;
	console.log(branchSize);
	branchNames.forEach(function (branchName) {
		//updatedBranch=branchName.substr(0).slice(0,)
		updatedBranch = branchName.replace("'", "");
		getTheBranchDetails(updatedBranch);
	}
	)
}

function getTheBranchDetails(updatedBranch) {
	if (updatedBranch != null && updatedBranch.startsWith("SF-")) {
		request({
			'headers': {
				'Authorization': 'Basic cHJhdGVlay5uZWVsZ3VuZDpIdWJsaSYxMjM=',
				'user-agent': 'node.js'
			},
			'uri': 'http://jira.ef.com/rest/api/2/issue/' + updatedBranch,
			'method': 'GET'
		},
			function (err, res, body) {
				var jsonData = JSON.parse(body);
				verifyBranchDetails(jsonData, updatedBranch);
				branchStatus=jsonData.fields.status;
				releaseVersion=jsonData.fields.status.name;
			})
	}
	else{
		console.log("Branch that does not start with SF are -"+updatedBranch);
	}
}

function verifyBranchDetails(jsonData, updatedBranch) {
	if (jsonData != null && jsonData.fields != null && jsonData.fields.status != null && jsonData.fields.status.name == 'Done' && jsonData.fields.fixVersions[0] != null) {
		updatedBranchNames.push(updatedBranch);
		verifyCount = verifyCount + 1;
	}
	else {
		verifyCount = verifyCount + 1
	}
	if (verifyCount == branchSize) { 
		console.log("Branches that can be deleted are : " + updatedBranchNames+branchStatus+releaseVersion);
		//deleteFeatureBranch(branchName);
	 }
}

function deleteFeatureBranch(branchName) {
	console.log("start");
	request(
		{
			'headers':
			{
				'Authorization': 'token ba2d620a1437a4e9b7549388392a03af3ba9c1c1',
				'X-GitHub-Media-Type': 'application/vnd.github.symmetra-preview+json',
				'user-agent': 'node.js',
				'Content-Type' : 'application/json'
			},
			'uri': 'https://api.github.com/repos/ILC-Technology/Salesforce/git/refs/heads/' + branchName,
			'method': 'DELETE'
		},
		function (err, res, body) {
		})

}

getOpenFeatureBranchesFromGit();


function deleteUnusedBranches() {
	var branches = getOpenFeatureBranchesFromGit();
	console.log("Need to filter the Branch from the output");
	branches.forEach(function (branch) {
		if (canBeDeleted(branch)) {
			deleteFeatureBranch(branch);
		}
	});
}
