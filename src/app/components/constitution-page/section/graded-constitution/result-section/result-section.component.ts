import { Component, Input, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Sort } from '@angular/material/sort';
import { MathService } from 'src/app/services/math.service';
import { Constitution } from 'src/app/types/constitution';
import { Song } from 'src/app/types/song';
import { User } from 'src/app/types/user';
import { compareResultScoreDSC, extractValuesOfVotes, GradeVote, ResultGradeVote } from 'src/app/types/vote';

@Component({
  selector: 'graded-result-section',
  templateUrl: './result-section.component.html',
  styleUrls: ['./result-section.component.scss']
})
export class GradedResultSectionComponent implements OnInit {
  @Input() constitution: Constitution;
  @Input() users: User[];
  @Input() votes: GradeVote[];
  @Input() currentUser: User;
  
  public results: ResultGradeVote[];

  ngOnInit() {
    this.results = this.calculateResults();
  }

  constructor(private math: MathService,
              private afs: AngularFirestore) {
  }

  userMeanVotes(uid: string): number {
    const currentUserVote: GradeVote[] = [];
    for (const vote of this.votes) {
      if (vote.userID === uid) {
        currentUserVote.push(vote);
      }
    }
    return this.math.mean(extractValuesOfVotes(currentUserVote));
  }

  userMeanSongs(uid: string): number {
    if (this.constitution.songs === undefined) return 0;
    const currentUserSongsVote: GradeVote[] = [];
    for (const vote of this.votes) {
      if (this.constitution.songs.find(x => x.id === vote.songID && x.patron === uid)) {
        currentUserSongsVote.push(vote);
      }
    }
    return this.math.mean(extractValuesOfVotes(currentUserSongsVote));
  }

  userMeanUser(uid1: string, uid2: string): number {
    const user1Songs: Song[] = [];
    for (const song of this.constitution.songs) {
      if (song.patron === uid1) {
        user1Songs.push(song);
      }
    }
    const user2Votes: GradeVote[] = [];
    for (const vote of this.votes) {
      if (user1Songs.find(x => x.id === vote.songID && x.patron === uid1 && vote.userID === uid2)) {
        user2Votes.push(vote);
      }
    }
    return this.math.mean(extractValuesOfVotes(user2Votes));
  }

  sortDataResult(sort: Sort) {
    if (this.results === undefined) {
      this.results = this.calculateResults();
    }
    
    if(!sort.active || sort.direction === '') { return; }

    const data = this.results.slice();
    this.results = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case "id": return this.compare(a.songID, b.songID, isAsc);
        case "title": return this.compare(a.title, b.title, isAsc);
        case "author": return this.compare(a.author, b.author, isAsc);
        case "user": return this.compare(this.showDisplayName(a.userID), this.showDisplayName(b.userID), isAsc);
        case "score": return this.compare(a.score, b.score, isAsc);
        default: return 0;
      }
    });
  }

  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  showDisplayName(uid: string): string {
    const user = this.users.find(x => x.uid === uid);
    if (user !== undefined) { return user.displayName; }
    return "";
  }

  calculateResults(): ResultGradeVote[] {
    const results: ResultGradeVote[] = [];
    for(const song of this.constitution.songs) {
      const selectedVotes = [];
      for(const vote of this.votes) {
        if (vote.songID === song.id) {
          selectedVotes.push(vote);
        }
      }
      const mean = this.math.mean(extractValuesOfVotes(selectedVotes));
      const user = this.users.find(x => {return x.uid === song.patron});
      if (user !== undefined) {
        results.push({
          songID: song.id,
          title: song.shortTitle,
          author: song.author,
          url: song.url,
          score: mean,
          userID: user.uid
        });
      }
    }

    results.sort(compareResultScoreDSC);

    if (this.constitution.winnerSongID !== results[0].songID && this.constitution.winnerUserID !== results[0].userID) {
      this.afs.collection("constitutions/").doc(this.constitution.id).update({
        winnerSongID: results[0].songID,
        winnerUserID: results[0].userID
      });
    }

    return results;
  }

}