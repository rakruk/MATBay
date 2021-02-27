import { Component, Input, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { User } from '../../../../../types/user';
import { Constitution } from 'src/app/types/constitution';
import { compareResultScoreDSC, extractValuesOfVotes, GradeVote, ResultGradeVote } from 'src/app/types/vote';
import { MathService } from 'src/app/services/math.service';
import { MatAccordion } from '@angular/material/expansion';

@Component({
  selector: 'graded-owner-section',
  templateUrl: './owner-section.component.html',
  styleUrls: ['./owner-section.component.scss']
})
export class GradedOwnerSectionComponent {

  @Input() constitution: Constitution;
  @Input() users: User[];
  @Input() votes: GradeVote[];
  @Input() currentUser: User;

  @ViewChild(MatAccordion) accordion: MatAccordion;

  constructor(
    private afs: AngularFirestore,
    private router: Router,
    private math: MathService
  ) { }

  canLockSongList(): boolean {
    return this.constitution.songs.length === this.constitution.numberMaxOfUser * this.constitution.numberOfSongsPerUser;
  }

  canPublishResults(): boolean {
    const numberOfVotes = this.constitution.numberOfSongsPerUser * this.constitution.numberMaxOfUser * (this.constitution.numberMaxOfUser - 1);
    return this.votes.length === numberOfVotes;
  }

  canFinishConstitution(): boolean {
    return this.constitution.winnerSongID !== -1 && this.constitution.winnerUserID !== '' && this.constitution.isShowingResult;
  }

  changeResultsStatus(status: boolean): void {
    this.afs.collection("constitutions/").doc(this.constitution.id).update({
      isShowingResult: status
    });
  }

  changeLockStatus(status: boolean): void {
    this.afs.collection("constitutions/").doc(this.constitution.id).update({
      isLocked: status
    });
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
        winnerSongID: results[0].userID,
        winnerUserID: results[0].songID
      });
    }

    return results;
  }

  finishConstitution(): void {
    if (this.constitution.winnerUserID === '' || this.constitution.winnerSongID === -1) {
      this.calculateResults();
    }

    let winnerSong = this.constitution.songs.find(x => x.id === this.constitution.winnerSongID);
    let winnerUser = this.users.find(x => x.uid === this.constitution.winnerUserID);

    let usernames: string[] = [];
    for (const user of this.users) {
      usernames.push(user.uid);
    }

    let songsTitle: string[] = [];
    let songsAuthor: string[] = [];
    let songsOwner: string[] = [];
    let songsURL: string[] = [];

    for(const song of this.constitution.songs) {
      songsTitle.push(song.shortTitle);
      songsAuthor.push(song.author);
      songsURL.push(song.url);
      songsOwner.push(song.patron);
    }

    this.afs.collection("history").add({
      season: this.constitution.season,
      part: this.constitution.part,
      name: this.constitution.name,
      ownerID: this.constitution.owner,
      youtubePlaylistID: this.constitution.youtubePlaylistID,

      winnerID: winnerUser.uid,
      winnerSongURL: winnerSong.url,
      winnerSongTitle: winnerSong.shortTitle,
      winnerSongAuthor: winnerSong.author,

      usernames: usernames,
      songsTitle: songsTitle,
      songsOwner: songsOwner,
      songsAuthor: songsAuthor,
      songsURL: songsURL
    });

    this.deleteConstitution();
  }

  deleteConstitution(): void {
    for (const vote of this.votes) {
      this.afs.collection("constitutions/").doc(this.constitution.id).collection("/votes").doc(vote.id).delete();
    }

    for (const song of this.constitution.songs) {
      this.afs.collection("constitutions/").doc(this.constitution.id).collection("/songs").doc(song.id.toString()).delete();
    }

    this.afs.collection("constitutions/").doc(this.constitution.id).delete();

    this.router.navigate(['current-constitutions']);
  }

}
