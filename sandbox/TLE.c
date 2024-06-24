#include <stdio.h>
#include<unistd.h>
#include<time.h>

int main(){
    while(1){
        printf("Hello World\n");
        fflush(stdout);
        sleep(1);
    }
}