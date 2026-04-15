pipeline {
    agent any

    triggers {
        // Vérifie GitHub toutes les 5 minutes
        pollSCM('H/5 * * * *')
    }

    environment {
        BACKEND_IMAGE  = "aycha123/mon-dashboard-backend"
        FRONTEND_IMAGE = "aycha123/mon-dashboard-frontend"
        IMAGE_TAG      = "v${BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Detect Changes') {
            steps {
                script {
                    // Détecte si le dernier commit vient de Jenkins
                    def lastCommitAuthor = sh(
                        script: 'git log -1 --format="%an"',
                        returnStdout: true
                    ).trim()

                    if (lastCommitAuthor == "Jenkins CI") {
                        currentBuild.result = 'ABORTED'
                        error("⛔ Commit fait par Jenkins → on arrête pour éviter la boucle")
                    }
                }
            }
        }

        stage('Install & Build') {
            parallel {
                stage('Backend') {
                    steps {
                        dir('backend') {
                            sh 'pip install -r requirements.txt --break-system-packages || true'
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            sh '''
                                export NVM_DIR="$HOME/.nvm"
                                . "$NVM_DIR/nvm.sh"
                                nvm use 20
                                npm ci
                                npm run build
                            '''
                        }
                    }
                }
            }
        }

        stage('Build & Push Docker') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                    sh '''
                        docker build -t $BACKEND_IMAGE:$IMAGE_TAG -t $BACKEND_IMAGE:latest backend/
                        docker build -t $FRONTEND_IMAGE:$IMAGE_TAG -t $FRONTEND_IMAGE:latest frontend/

                        echo $PASS | docker login -u $USER --password-stdin

                        docker push $BACKEND_IMAGE:$IMAGE_TAG
                        docker push $BACKEND_IMAGE:latest
                        docker push $FRONTEND_IMAGE:$IMAGE_TAG
                        docker push $FRONTEND_IMAGE:latest
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    docker compose pull || true
                    docker compose down --remove-orphans || true
                    docker compose up -d --force-recreate
                    docker image prune -f
                '''
            }
        }

        // ✅ Jenkins fait git add, commit, push automatiquement
        stage('Auto Git Commit & Push') {
            steps {
                script {
                    withCredentials([gitUsernamePassword(credentialsId: 'github-credentials', gitToolName: 'Default')]) {
                        sh '''
                            git config user.name "Jenkins CI"
                            git config user.email "jenkins@aycha123.com"

                            git checkout main || git checkout master
                            git fetch origin
                            git pull --rebase origin main

                            # Mise à jour fichier VERSION
                            echo "v${BUILD_NUMBER} - $(date '+%Y-%m-%d %H:%M:%S')" > VERSION

                            # ✅ git add TOUT
                            git add -A .

                            git status --short

                            if git diff --cached --quiet; then
                                echo "ℹ️ Rien à commiter"
                            else
                                git commit -m "chore: auto-deploy build #${BUILD_NUMBER} [skip ci]"
                                git push origin main
                                echo "✅ Push automatique réussi !"
                            fi
                        '''
                    }
                }
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline réussi'
        }
        failure {
            echo '❌ Pipeline échoué'
        }
        always {
            sh 'docker logout || true'
            cleanWs()
        }
    }
}