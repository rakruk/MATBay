import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/app/services/auth.service';
import { ConstitutionManagerService } from 'src/app/services/constitution-manager.service';
import { RoutingService } from 'src/app/services/routing.service';
import { Constitution, EMPTY_CONSTITUTION } from 'src/app/types/constitution';
import { Status } from 'src/app/types/status';
import { User } from 'src/app/types/user';

@Component({
  selector: 'app-new-constitution-window',
  templateUrl: './new-constitution-window.component.html',
  styleUrls: ['./new-constitution-window.component.scss']
})
export class NewConstitutionWindowComponent {

  private currentUser: User;
  public currentStatus: Status;
  public formIsMissingParameters: boolean;

  public newConstitutionForm: FormGroup;
  private newConstitutionParameter: Constitution;

  constructor(private dialogRef: MatDialogRef<NewConstitutionWindowComponent>,
              private constitutionManager: ConstitutionManagerService,
              public auth: AuthService,
              private routing: RoutingService) {
    this.currentUser = auth.user$.getValue();
    auth.user$.subscribe(newUser => this.currentUser = newUser);

    this.currentStatus = {
      error: false,
      hidden: true,
      message: ""
    }

    this.newConstitutionParameter = EMPTY_CONSTITUTION;
    this.formIsMissingParameters = false;

    this.newConstitutionForm = new FormGroup({
      formSeason: new FormControl(),
      formRound: new FormControl(),
      formName: new FormControl(),
      formIsPublic: new FormControl(),
      formYoutubePlaylist: new FormControl(),
      formNumberOfSongsPerUser: new FormControl(),
      formIsAnonymous: new FormControl(),
      formNumberOfUser: new FormControl()
    })
  }

  isMissingParameters(): boolean {
    const seasonIsMissing: boolean = (this.newConstitutionParameter.season === null);
    const roundIsMissing: boolean = (this.newConstitutionParameter.round === null);
    const nameIsMissing: boolean = (this.newConstitutionParameter.name === null);
    const numberOfSongsPerUserIsMissing: boolean = (this.newConstitutionParameter.numberOfSongsPerUser === null);

    this.formIsMissingParameters = seasonIsMissing || roundIsMissing || nameIsMissing || numberOfSongsPerUserIsMissing;

    return this.formIsMissingParameters;
  }

  updateParameters(): void {
    this.newConstitutionParameter.season = this.newConstitutionForm.value['formSeason'];
    this.newConstitutionParameter.round = this.newConstitutionForm.value['formRound'];
    this.newConstitutionParameter.name = this.newConstitutionForm.value['formName'];
    this.newConstitutionParameter.isPublic = this.newConstitutionForm.value['formIsPublic'];
    this.newConstitutionParameter.youtubePlaylistID = this.newConstitutionForm.value['formYoutubePlaylist'];
    this.newConstitutionParameter.numberOfSongsPerUser = this.newConstitutionForm.value['formNumberOfSongsPerUser'];
  }

  createNewConstitution(): void {
    this.updateParameters();

    if (!this.isMissingParameters()) {
      let newConstitution: Constitution = {
        season:  this.newConstitutionParameter.season,
        round: this.newConstitutionParameter.round,
        name: this.newConstitutionParameter.name,
        isPublic: this.newConstitutionParameter.isPublic,
        owner: this.currentUser.uid,
        winnerUserIndex: -1,
        users: [this.currentUser.uid],
        songs: [],
        winnerSongIndex: -1,
        youtubePlaylistID: this.newConstitutionParameter.youtubePlaylistID? this.newConstitutionParameter.youtubePlaylistID : "",
        numberOfSongsPerUser: this.newConstitutionParameter.numberOfSongsPerUser,
      }

      this.routing.addConstitutionRoute(newConstitution.youtubePlaylistID);

      this.constitutionManager.constitutions.push(newConstitution);
      this.closeWindow();
    } else {
      this.currentStatus.error = true;
      this.currentStatus.message = "Erreur : Paramètre manquant";
    }
  }

  closeWindow(): void {
    this.dialogRef.close();
  }
}
