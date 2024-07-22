#include <stdio.h>
#include <string.h>

// Function to reverse a string in place
void reverseString(char *str) {
    int length = strlen(str);
    int start = 0;
    int end = length - 1;
    char temp;

    while (start < end) {
        // Swap the characters at the start and end
        temp = str[start];
        str[start] = str[end];
        str[end] = temp;
        start++;
        end--;
    }
}

int main() {
    int t;
    scanf("%d", &t);
    getchar(); // to consume the newline character after scanf

    for (int i = 0; i < t; i++) {
        char str[1000];
        fgets(str, sizeof(str), stdin);
       int arr;
       printf("%d",arr[100]);
    }

    return 0;
}
