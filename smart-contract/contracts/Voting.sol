// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BlockVote {

    address public admin;

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    modifier electionExists(uint _electionId) {
        require(_electionId > 0 && _electionId <= electionCount, "Election not found");
        _;
    }

    struct Candidate {
        uint id;
        string name;
        string party;
        string imageUrl;
        address walletAddress;
        uint votes;
    }

    struct Election {
        uint id;
        string title;
        string description;
        uint startDate;
        uint endDate;
        bool active;
        uint totalVotes;
        uint candidateCount;

        mapping(uint => Candidate) candidates;
        mapping(address => bool) voters;
    }

    uint public electionCount;

    mapping(uint => Election) private elections;

    event ElectionCreated(uint electionId, string title);
    event CandidateAdded(uint electionId, uint candidateId);
    event VoteCast(uint electionId, uint candidateId, address voter);

    // CREATE ELECTION
    function createElection(
        string memory _title,
        string memory _description,
        uint _startDate,
        uint _endDate
    ) public onlyAdmin {

        require(_endDate > _startDate, "Invalid dates");

        electionCount++;

        Election storage e = elections[electionCount];

        e.id = electionCount;
        e.title = _title;
        e.description = _description;
        e.startDate = _startDate;
        e.endDate = _endDate;
        e.active = false;

        emit ElectionCreated(electionCount, _title);
    }

    // ADD CANDIDATE
    function addCandidate(
        uint _electionId,
        string memory _name,
        string memory _party,
        string memory _imageUrl,
        address _wallet
    )
        public
        onlyAdmin
        electionExists(_electionId)
    {
        Election storage e = elections[_electionId];

        e.candidateCount++;

        e.candidates[e.candidateCount] = Candidate({
            id: e.candidateCount,
            name: _name,
            party: _party,
            imageUrl: _imageUrl,
            walletAddress: _wallet,
            votes: 0
        });

        emit CandidateAdded(_electionId, e.candidateCount);
    }

    // START ELECTION
    function startElection(uint _electionId)
        public
        onlyAdmin
        electionExists(_electionId)
    {
        elections[_electionId].active = true;
    }

    // END ELECTION
    function endElection(uint _electionId)
        public
        onlyAdmin
        electionExists(_electionId)
    {
        elections[_electionId].active = false;
    }

    // VOTE
    function vote(uint _electionId, uint _candidateId)
        public
        electionExists(_electionId)
    {
        Election storage e = elections[_electionId];

        require(e.active, "Election not active");
        require(!e.voters[msg.sender], "Already voted");
        require(_candidateId > 0 && _candidateId <= e.candidateCount, "Invalid candidate");

        e.voters[msg.sender] = true;

        e.candidates[_candidateId].votes++;

        e.totalVotes++;

        emit VoteCast(_electionId, _candidateId, msg.sender);
    }

    // CHECK IF USER VOTED
    function hasVoted(uint _electionId, address _voter)
        public
        view
        electionExists(_electionId)
        returns(bool)
    {
        return elections[_electionId].voters[_voter];
    }

    // GET ELECTION BASIC INFO
    function getElection(uint _electionId)
        public
        view
        electionExists(_electionId)
        returns (
            uint id,
            string memory title,
            string memory description,
            uint startDate,
            uint endDate,
            bool active,
            uint totalVotes,
            uint candidateCount
        )
    {
        Election storage e = elections[_electionId];

        return (
            e.id,
            e.title,
            e.description,
            e.startDate,
            e.endDate,
            e.active,
            e.totalVotes,
            e.candidateCount
        );
    }

    // GET CANDIDATE
    function getCandidate(uint _electionId, uint _candidateId)
        public
        view
        electionExists(_electionId)
        returns (
            uint id,
            string memory name,
            string memory party,
            string memory imageUrl,
            address walletAddress,
            uint votes
        )
    {
        Candidate storage c = elections[_electionId].candidates[_candidateId];

        return (
            c.id,
            c.name,
            c.party,
            c.imageUrl,
            c.walletAddress,
            c.votes
        );
    }

    // GET WINNER
    function getWinner(uint _electionId)
        public
        view
        electionExists(_electionId)
        returns(uint winnerId, uint votes)
    {
        Election storage e = elections[_electionId];

        uint highestVotes = 0;
        uint winningCandidate = 0;

        for(uint i = 1; i <= e.candidateCount; i++) {

            if(e.candidates[i].votes > highestVotes) {
                highestVotes = e.candidates[i].votes;
                winningCandidate = i;
            }

        }

        return (winningCandidate, highestVotes);
    }
}