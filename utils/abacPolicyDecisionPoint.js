class abacPolicyDecisionPoint {
    constructor() {
  
        this.rolesSet = {
            lead: "lead",
            co_lead: "co_lead",
            problem_setter: "problem_setter",
            participant: "participant"
          };
          
          this.actionsSet = {
            deleteUser: "delete_user",
            updateUser: "update_user",
            banUser: "ban_user",
            createContest: "create_contest",
            deleteContest: "delete_contest",
            updateContest: "update_contest",
            viewContest: "view_contest",
            createBlog: "create_blog",
            deleteBlog: "delete_blog",
            updateBlog: "update_blog",
            createProblem: "create_problem",
            updateProblem: "update_problem",
            deleteProblem: "delete_problem",
            viewProblem: "view_problem",
            addEditorial: "add_editorial"
          };
          
          this.resourcesSet = {
            user: "user",
            contest: "contest",
            blog: "blog",
            problem: "problem",
            editorial: "editorial"
          };
      
        this.allowed = [
            {
                user:{
                    attributes: {
                      role: this.rolesSet.problem_setter,
                    }
                },
                action: this.actionsSet.addEditorial,
                resourse : {
                    type:this.resourcesSet.problem,
                    attributes : {
                    //   isBanned: this.resourcesSet.banned
                    }
                }
            },
            {
              user:{
                  attributes: {
                    role: this.rolesSet.lead,
                  }
              },
              action: this.actionsSet.addEditorial,
              resourse : {
                  type:this.resourcesSet.problem,
                  attributes : {
                  //   isBanned: this.resourcesSet.banned
                  }
              }
          },
          {
            user:{
                attributes: {
                  role: this.rolesSet.co_lead,
                }
            },
            action: this.actionsSet.addEditorial,
            resourse : {
                type:this.resourcesSet.problem,
                attributes : {
                //   isBanned: this.resourcesSet.banned
                }
            }
        },
        ];
    }
  
    isAllowed(conditionalSet) {
      return this.allowed.some((data) => {
        return JSON.stringify(data) === JSON.stringify(conditionalSet); 
      });
    }
  }
  
  module.exports = abacPolicyDecisionPoint;
  