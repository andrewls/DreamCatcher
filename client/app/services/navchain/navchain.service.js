'use strict';

angular.module('dreamCatcherApp')
  .factory('navchain', function () {
	// Service logic
	// ...

	var chain = [];
	var selectedItem = null;
	var selectedType = null;
	
	//HOW DO I INITIALIZE THE DATA FROM THE SERVER?
	//HOW DO I BIND TO THE selectedItem IN MY SIDENAV DIRECTIVE?
		//Breadcrumbs also needs to bind to the whole chain.
	
	// Public API here
	return {
		forward: function (id) {
			//Use this method to go deeper in the chain
			//Ensure that the id is actually one of the children
			//of the last item in the chain
			//Get the item with the specified ID from the server
			//Append the item to the end of the chain
			//Set selected Item and Type to the last element in the chain
			
			//WOULD MOVING FROM HOME INTO A DREAM REQUIRE PAGE ROUTING?
		}
		
		back: function(){
			//Use this method to go back a level in the chain
			//Remove last element from the chain
			//Set selected Item and Type to the last element in the chain
		}
		
		jump: function(numSteps){
			//Use this method to go back multiple steps
			//0 steps: stay put
			//1 or more steps: go back that many steps
			//if numSteps > chain.length, go to level of user home page
			
			//Simply remove the specified number of items from the chain.
			//Reset selected Item and Type to the end of the chain.
		}
		
		getSelectedChildren: function(){
			//RETURNS AN ARRAY OF SUBGOALS
			//Do we want to return the actual subGoals,
			//or just the names and id's (which are already stored in selectedItem)
			//Getting actual children would be helpful for Timeline
		}
		
		getSelectedType: function(){
			return selectedType;
		}
		
		getSelectedItem: function(){
			return selectedItem;
		}
		
		getChain: function(){
			return chain;
		}
	};
});